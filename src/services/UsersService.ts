import {Inject, Injectable} from "@tsed/di";
import bcrypt from "bcryptjs";
import { User } from "src/models/UserModel.js";
// import { MongooseModel } from "@tsed/mongoose"
import type { Model } from "mongoose";
@Injectable()
export class UsersService {
@Inject(User) private readonly model: Model<User>;

  async create(body: any): Promise<User> {
    return this.model.create(body)
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

  async findAll(): Promise<User[]> {
    return await this.model.find().sort({ createdAt: -1 });
  }

  attachToken(user: User, token: string) {
    user.token = token;
  }
}
