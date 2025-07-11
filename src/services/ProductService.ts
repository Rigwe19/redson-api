import { Inject, Injectable } from "@tsed/di";
import { Model } from "mongoose";
import { Product } from "src/models/ProductModel.js";

@Injectable()
export class ProductService {
  @Inject(Product) private readonly model: Model<Product>;
  async create(body: any): Promise<Product> {
    return this.model.create(body);
  }
  async findOne(query: any): Promise<Product | undefined | null> {
    return await this.model.findOne(query);
  }
  async findAll(): Promise<Product[]> {
    return await this.model.find().sort({ createdAt: -1 });
  }
  async update(query: string, body: any): Promise<Product | null> {
    return await this.model.findOneAndUpdate({ _id: query }, body, {
      new: true,
      runValidators: true,
    });
  }

  async delete(query:string): Promise<boolean | null> {
    return await this.model.findByIdAndDelete({ _id: query });
  }
}
