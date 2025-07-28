
import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Property, Required } from "@tsed/schema";
import { User } from "./UserModel.js";
import { Product } from "./ProductModel.js";

@Model({
  schemaOptions: {
    timestamps: true
  }
})
export class View {
  @ObjectID("id")
  _id: string;

  @Required()
  @Ref(() => Product)
  product_id: Ref<Product>;

  @Ref(() => User)
  user_id: Ref<User>; // optional

  @Property()
  ip_address?: string;
}