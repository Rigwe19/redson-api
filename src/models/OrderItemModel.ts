import { Model, ObjectID, Ref } from "@tsed/mongoose";
import {Property} from "@tsed/schema";
import { Order } from "./OrderModel.js";
import { Product } from "./ProductModel.js";

@Model({
  schemaOptions: {
    timestamps: true,
  },
})
export class OrderItem {
  @ObjectID("id")
  @Property()
  _id: string;

  @Ref(() => Order)
  order_id: Ref<Order>;

  @Ref(() => Product)
  product_id: Ref<Product>;

  @Property()
  quantity: number;

  @Property()
  unit_price: number;

  @Property()
  size: string;

  @Property()
  color: string;
}
