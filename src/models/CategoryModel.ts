import { Model, ObjectID } from "@tsed/mongoose";
import { Property } from "@tsed/schema";

@Model({
  schemaOptions: {
    timestamps: true,
  },
})
export class Category {
  @ObjectID("id")
  @Property()
  _id: string;

  @Property()
  name: string;

  @Property()
  slug: string;

  @Property()
  description: string;
}
