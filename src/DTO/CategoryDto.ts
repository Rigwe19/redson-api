import { Required } from "@tsed/schema";
import { Category } from "src/models/CategoryModel.js";

export class CategoryDto {
  @Required()
  name: string;

  @Required()
  description: string;
}
export class CategoryResponseDto {
  success: boolean;
  message?: string;
  categories: Category[]
}