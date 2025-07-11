import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Property } from "@tsed/schema";
import { User } from "./UserModel.js";

@Model({
  schemaOptions: {
    timestamps: true,
  },
})
export class Cart {
  @Property()
  @ObjectID("id")
  _id: string;

  @Ref(() => User)
  user_id: Ref<User>;
}