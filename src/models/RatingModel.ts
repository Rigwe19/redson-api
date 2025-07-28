import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Max, Min, Optional, Property, Required } from "@tsed/schema";
import { Product } from "./ProductModel.js";
import { User } from "./UserModel.js";

@Model({
  schemaOptions: {
    timestamps: true,
  },
})
export class Rating {
  @Property()
  @ObjectID("id")
  _id: string;

  @Required()
  @Min(1)
  @Max(5)
  value: number;

  @Property()
  @Optional()
  comment?: string;

  @Ref(() => User)
  user_id: Ref<User>;

  @Required()
  @Ref(() => Product)
  product_id: Ref<Product>;
}
