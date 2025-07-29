import { Inject, Injectable } from "@tsed/di";
import bcrypt from "bcryptjs";
import { User } from "src/models/UserModel.js";
import { OAuth2Client } from "google-auth-library";
import { type MongooseModel } from "@tsed/mongoose";
// import type { Model } from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";
import { PasswordResetToken } from "src/models/PasswordResetTokenModel.js";
import * as nodeCrypto from "crypto";
import { MailService } from "./MailService.js";

@Injectable()
export class UsersService {
  @Inject(User) private readonly model: MongooseModel<User>;
  @Inject(PasswordResetToken)
  private readonly password: MongooseModel<PasswordResetToken>;
  @Inject() private readonly mailService: MailService;

  private readonly client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });
  async create(body: any): Promise<User> {

    await this.mailService.sendWelcomeEmail(body.email, body.firstName);
    return this.model.create({ ...body, type: "email" });
  }

  async findOne(query: any): Promise<User | undefined | null> {
    return await this.model.findOne(query);
  }

  async verifyPassword(password: string, email: string) {
    const user = await this.findOne({ email });
    if (!user?.password) {
      return false;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch;
  }

  async changePassword(body: {
    current: string;
    password: string;
    user_id: string;
  }) {
    const user = await this.model.findById(body.user_id);
    if (!user?.password) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(body.current, user.password);
    if (!isMatch) {
      throw new Error("Current password does not match what we have");
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(body.password, salt);
    return await user.updateOne({
      password: password,
    });
  }

  async findAll(): Promise<User[]> {
    return await this.model.find().sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<User | null> {
    return this.model.findById(id);
  }

  async deleteById(id: string, password: string): Promise<void> {
    const user = await this.model.findById(id);
    if (!user?.password) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Current password does not match what we have");
    }
    await this.model.findByIdAndDelete(id);
  }

  async verifyGoogleToken(token: string) {
    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(data);

    // Find or create the user
    let user = await this.model.findOne({ email: data.email });

    user ??= await this.model.create({
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
      role: "user",
      type: "google",
      password: Math.random().toString(36).slice(-8), // Optional fallback
    });

    // Generate your app JWT
    const jwtToken = jwt.sign(
      { sub: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return { user, token: jwtToken };

    // return {
    //   email: data.email,
    //   name: data.name,
    //   picture: data.picture,
    //   sub: data.sub,
    // };
    // const tokenInfo = await this.client.getTokenInfo(token);
    // const ticket = await this.client.verifyIdToken({
    //   idToken: token,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });

    // const payload = ticket.getPayload();

    // if (!payload?.email) {
    //   throw new Error("Invalid Google token");
    // }
  }

  attachToken(user: User, token: string) {
    user.token = token;
  }

  async changePhone(user_id: string, phoneNumber: string) {
    return await this.model.findByIdAndUpdate(user_id, {
      phoneNumber,
    });
  }

  async changeDetails(
    user_id: string,
    body: { firstName: string; lastName: string }
  ) {
    return await this.model.findByIdAndUpdate(user_id, {
      ...body,
    });
  }

  async sendForgotPasswordOtp(email: string) {
    const user = await this.model.findOne({ email });
    if (!user) throw new Error("No user with this email");

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const token = nodeCrypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.password.create({
      user: user._id,
      otp,
      token,
      expiresAt,
      used: false,
    });

    await this.mailService.sendPasswordReset(user.email, {
      name: user.firstName,
      otp,
    });

    return { message: "OTP sent to your email" };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.model.findOne({ email });
    if (!user) throw new Error("Invalid email");

    const record = await this.password.findOne({
      user: user._id,
      otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) throw new Error("Invalid or expired OTP");

    return { resetToken: record.token };
  }

  async resetPassword(token: string, newPassword: string) {
    const reset = await this.password.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!reset) throw new Error("Invalid or expired token");

    const user = await this.model.findById(reset.user);
    if (!user) throw new Error("User not found");

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);
    user.password = password;
    await user.save();

    reset.used = true;
    await reset.save();

    return { message: "Password has been reset" };
  }
}
