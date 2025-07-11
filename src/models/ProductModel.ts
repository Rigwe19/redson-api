import { Model, ObjectID, Ref } from "@tsed/mongoose";
import {
  CollectionOf,
  Default,
  MaxLength,
  Property,
  Required,
} from "@tsed/schema";
import { Category } from "./CategoryModel.js";

interface Image {
  url: string;
  public_id: string;
}
@Model({
  schemaOptions: {
    timestamps: true,
  },
})
export class Product {
  @ObjectID("id")
  @Property()
  _id: string;

  @Property()
  @Required()
  @MaxLength(100)
  name: string;

  @Property()
  slug: string;

  @Property()
  @Required()
  @MaxLength(1000)
  description: string;

  @Property()
  @Required()
  price: number;

  @Property()
  @Required()
  inventory: number;

  @Ref(() => Category)
  category_id: Ref<Category>;

  @Property()
  images: Image[]; // Replace 'any' with your image schema/model if available

  @CollectionOf(String)
  sizes: string[]; // Replace 'any' with a specific type if available

  @CollectionOf(String)
  colors: string[]; // Replace 'any' with a specific type if available

  @Property()
  discount: number;
}
