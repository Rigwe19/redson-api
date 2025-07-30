import { Model, ObjectID } from "@tsed/mongoose";
import { Property, Required, Format, MaxLength, MinLength } from "@tsed/schema";

@Model({
  schemaOptions: {
    timestamps: true
  }
})
export class Contact {
  @ObjectID("id")
  _id: string;

  @Property()
  @Required()
  @MinLength(2)
  @MaxLength(50)
  fullName: string;

  @Property()
  @Required()
  @Format("email")
  email: string;

  @Property()
  @Required()
  @MinLength(11)
  @MaxLength(20)
  phone: string;

  @Property()
  @Required()
  @MinLength(5)
  @MaxLength(500)
  message: string;
}
