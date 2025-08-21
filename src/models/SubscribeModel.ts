import { Model, ObjectID, Unique } from "@tsed/mongoose";
import { Property, Required, Format } from "@tsed/schema";

@Model({
  schemaOptions: {
    timestamps: true
  }
})
export class Subscribe {
  @ObjectID("id")
  _id: string;

  @Property()
  @Required()
  @Format("email")
  email: string;

  @Property()
  @Required()
  frequency: string;
}
