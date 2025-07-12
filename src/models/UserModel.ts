import { Model, ObjectID, PreHook, Ref, Unique } from "@tsed/mongoose";
import {
  CollectionOf,
  Example,
  Format,
  Groups,
  MaxLength,
  MinLength,
  Property,
  Required,
} from "@tsed/schema";
import { DocumentType } from "@typegoose/typegoose";
import bcrypt from "bcryptjs";
import { Address } from "./AddressModel.js";

@Model({
  schemaOptions: {
    timestamps: true,
  },
})
@PreHook("save", async (user: DocumentType<User>, next: any) => {
  if (user.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }

  if (Array.isArray(user.address) && user.address.length === 0) {
    user.set("address", undefined, { strict: false });
  }

  
  next();
})
export class User {
  @ObjectID("id")
  @Property()
  @Groups("!credentials")
  _id: string;

  @Groups("!credentials")
  @Required()
  @MinLength(3)
  firstName: string;

  @Groups("!credentials")
  @Required()
  @MaxLength(100)
  lastName: string;

  @Property()
  @Required()
  @Unique()
  @Format("email")
  @Example("admin@tsed.io")
  email: string;

  @Property()
  role: "user" | "admin" = "user";

  @MinLength(8)
  // @Select(false)
  @Groups("credentials")
  password: string;

  @Groups("token", "!credentials")
  token: string;

  @Groups("!credentials")
  @Ref(() => Address)
  @CollectionOf(() => Address)
  address?: Ref<Address>[];
}
