import { Model, ObjectID, Ref } from "@tsed/mongoose";
import {Description, Enum, Property} from "@tsed/schema";
import { Address } from "./AddressModel.js";
import { User } from "./UserModel.js";

@Model({
  schemaOptions: {
    timestamps: true,
  },
})
export class Order {
  @ObjectID("id")
  @Property()
  id: string;

  @Ref(() => User)
  user_id: Ref<User>;

  @Ref(() => Address)
  address_id: Ref<Address>;

  @Property()
  @Enum("pending", "processing", "shipped", "delivered", "cancelled")
  status: string;

  @Property()
  discount?: number;

  @Property()
  @Description('Before Discount if any')
  subtotal: number;

  @Property()
  delivery_fee: number;

  @Property()
  @Description('Discount + Subtotal + Delivery Fee')
  total: number;
}
