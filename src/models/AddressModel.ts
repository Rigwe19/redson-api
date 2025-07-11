import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Default, Optional, Property, Required } from "@tsed/schema";
import { User } from "./UserModel.js";

@Model({
  schemaOptions: {
    timestamps: true
  }
})
export class Address {
  @ObjectID("id")
  @Property()
  _id: string;

  @Ref(() => User)
  user: Ref<User>;

  @Property()
  @Required()
  firstName: string;

  @Property()
  @Required()
  lastName: string;

  @Property()
  @Required()
  address: string;

  @Property()
  @Required()
  city: string;

  @Property()
  @Required()
  state: string;

  @Property()
  @Required()
  country: string;

  @Property()
  @Required()
  phone: string;

  @Property()
  @Optional()
  company: string;

  @Property()
  @Default(false)
  active: boolean;

  // @Property()
  // updatedAt: Date = new Date();
}
