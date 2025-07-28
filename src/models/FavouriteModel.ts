import { Property } from "@tsed/schema";
import { Product } from "./ProductModel.js";
import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { User } from "./UserModel.js";

@Model({
  schemaOptions: {
    timestamps: true
  }
})
export class Favourite {
  @Property()
  @ObjectID("id")
  _id: string;

  @Ref(() => User)
  user_id: Ref<User>;

  @Ref(() => Product)
  product_id: Ref<Product>;
}
