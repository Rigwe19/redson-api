import { Constant, Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { BodyParams } from "@tsed/platform-params";
import { Delete, Get, Groups, Post, Returns, Security } from "@tsed/schema";
import jwt from "jsonwebtoken";
import { ChangePasswordDto } from "src/DTO/ChangePassworDto.js";
import { UsersService } from "src/services/UsersService.js";
import { User } from "../../models/UserModel.js";

@Controller("/auth")
export class AuthController {
  @Inject()
  private readonly usersService: UsersService;
  @Constant("passport.protocols.jwt.settings")
  jwtSettings: any;

  @Post("/register")
  // @Authenticate("local", {session: false})
  // @Returns(200, User).Groups("token", "info")
  // @Returns(200, {success: boolean, user: UserModel})
  async register(@BodyParams() user: User) {
    const save = await this.usersService.create(user);
    if (!save) {
      return {
        success: false,
      };
    }

    // Generate JWT token
    const { issuer, audience, secretOrKey, maxAge = 3600 } = this.jwtSettings;
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: issuer,
        aud: audience,
        sub: save._id,
        exp: now + maxAge,
        iat: now,
      },
      secretOrKey
    );
    return {
      success: true,
      // user: {...user, ...save},
      save,
      user,
      token,
    };
  }
  @Post("/login")
  @Authenticate("local", { session: false })
  // @(Returns(200, User).Groups("token", "info"))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login(
    @Req("user") user: User,
    @BodyParams() @Groups("credentials") credentials: User
  ) {
    console.log(credentials);
    return {
      success: true,
      token: user.token,
      user,
    };
  }
  // @Returns(401, { message: "Invalid credentials" })
  // @Returns(400, { message: "Bad request" })
  // @Returns(500, { message: "Internal server error" })
  @Post("/google")
  async googleLogin(@BodyParams("token") token: string) {
    console.log(token);
    const { user, token: jwtToken } = await this.usersService.verifyGoogleToken(
      token
    );

    return {
      success: true,
      message: "Login successful",
      token: jwtToken,
      user,
    };
  }

  @Get("/userinfo")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  @(Returns(200, User).Groups("info"))
  getUserInfo(@Req("user") user: User) {
    return user;
  }

  @Get("/users")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  // @(Returns(200, User[]).Groups("info"))
  async allUser() {
    const users = await this.usersService.findAll();
    return users;
  }

  @Post("/change-password")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async changePassword(
    @Req("user") user: User,
    @BodyParams() body: ChangePasswordDto
  ) {
    const { currentPassword, newPassword } = body;

    await this.usersService.changePassword({
      current: currentPassword,
      password: newPassword,
      user_id: user._id,
    });
    return {
      success: true,
      message: "Password changed successfully!",
    };
  }

  @Post("/phone-change")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async changePhone(
    @Req("user") user: User,
    @BodyParams("phoneNumber") phoneNumber: string
  ) {
    await this.usersService.changePhone(user._id, phoneNumber);

    return {
      success: true,
      message: "Phone Number Changed Successfully",
    };
  }

  @Post("/basic-details")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async changeDetails(
    @Req("user") user: User,
    @BodyParams("firstName") firstName: string,
    @BodyParams("lastName") lastName: string
  ) {
    await this.usersService.changeDetails(user._id, { firstName, lastName });

    return {
      success: true,
      message: "Phone Number Changed Successfully",
    };
  }

  @Delete("/:password")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async deleteAccount(
    @Req("user") user: User,
    @BodyParams("password") password: string
  ) {
    await this.usersService.deleteById(user._id, password);

    return {
      success: true,
      message: "Phone Number Changed Successfully",
    };
  }

  @Post("/forgot-password")
  async sendOtp(@BodyParams("email") email: string) {
    return this.usersService.sendForgotPasswordOtp(email);
  }

  @Post("/verify-otp")
  async verifyOtp(
    @BodyParams("email") email: string,
    @BodyParams("otp") otp: string
  ) {
    return this.usersService.verifyOtp(email, otp);
  }

  @Post("/reset-password")
  async resetPassword(
    @BodyParams("token") token: string,
    @BodyParams("newPassword") newPassword: string
  ) {
    return this.usersService.resetPassword(token, newPassword);
  }
}
