import { Model, ObjectID, Unique } from "@tsed/mongoose";
import {
  Property,
  Required,
  MinLength,
  MaxLength,
  Format
} from "@tsed/schema";

@Model({
  schemaOptions: {
    timestamps: true
  }
})
export class Partner {
  @ObjectID("id")
  _id: string;

  @Property()
  @Required()
  @MinLength(3)
  @MaxLength(100)
  @Unique()
  name: string;

  @Property()
  @Required()
  @Format("email")
  @Unique()
  email: string;

  @Property()
  @Required()
  @Unique()
  phone: string;

  @Property()
  @Required()
  @MinLength(3)
  @MaxLength(100)
  address: string;

  @Property()
  @Required()
  @MinLength(3)
  @MaxLength(100)
  city: string;

  @Property()
  @Required()
  @MinLength(3)
  @MaxLength(100)
  state: string;

  @Property()
  @Required()
  @MinLength(3)
  @MaxLength(100)
  country: string;

  @Property()
  @Required()
  @MinLength(3)
  @MaxLength(100)
  company: string;
}
