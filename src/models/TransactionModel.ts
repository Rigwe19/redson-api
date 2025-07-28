import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Enum, Optional, Property } from "@tsed/schema";
import { Order } from "./OrderModel.js";
import { User } from "./UserModel.js";

@Model({
  schemaOptions: {
    timestamps: true,
  },
})
export class Transaction {
  @ObjectID("id")
  @Property()
  _id: string;

  @Ref(() => User)
  user_id: Ref<User>;

  @Ref(() => Order)
  order_id: Ref<Order>;

  @Property()
  amount: number;

  @Property()
  @Enum("cash", "flutterwave", "paystack")
  payment_method: string;

  @Property()
  @Enum("pending", "success", "failed", "refunded")
  status: string;

  @Property()
  transaction_id: string;

  @Property()
  @Optional()
  authorization: any;

  @Property()
  createdAt: Date;

  @Property()
  updatedAt: Date;
}
