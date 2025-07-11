import { Model, ObjectID, Ref } from "@tsed/mongoose";
import {Property} from "@tsed/schema";
import { Cart } from "./CartModel.js";
import { Product } from "./ProductModel.js";

@Model({
  schemaOptions: {
    timestamps: true,
  },
})
export class CartItem {
  @Property()
  @ObjectID("id")
  _id: string;

  @Ref(() => Cart)
  cart_id: Ref<Cart>;

  @Ref(() => Product)
  product_id: Ref<Product>;

  @Property()
  quantity: number;

  @Property()
  size: string;

  @Property()
  color: string;
}
