import { Model, ObjectID, Ref } from "@tsed/mongoose";
import {Property, Required} from "@tsed/schema";
import { User } from "./UserModel.js";

@Model({
  schemaOptions: {
    timestamps: true
  }
})
export class PasswordResetToken {
  @ObjectID("id")
  _id: string;

  @Ref(()=>User)
  user: Ref<User>

  @Property()
  @Required()
  otp: string;

  @Property()
  @Required()
  token: string;

  @Property()
  @Required()
  expiresAt: Date;

  @Property()
  used: boolean = false;
}
