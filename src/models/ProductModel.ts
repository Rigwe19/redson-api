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
interface Variant {
  sku: string;             // Unique stock keeping unit (optional)
  color: string;           // e.g. "Red"
  size: string;            // e.g. "L", "M", "42"
  stock: number;           // Quantity in stock
  price?: number;          // Optional override of basePrice
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

  @Property()
  @Default(5)
  reorderLevel: number;

  @Ref(() => Category)
  category_id: Ref<Category>;

  @Property()
  images: Image[];

  @Property()
  variants: Variant[];

  @CollectionOf(String)
  sizes: string[]; // Replace 'any' with a specific type if available

  @CollectionOf(String)
  colors: string[]; // Replace 'any' with a specific type if available

  @Property()
  discount: number;
}
