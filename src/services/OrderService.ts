import {Inject, Injectable} from "@tsed/di";
import { Model } from "mongoose";
import { OrderItem } from "src/models/OrderItemModel.js";
import { Order } from "src/models/OrderModel.js";

@Injectable()
export class OrderService {
@Inject(Order) private readonly model: Model<Order>;
@Inject(OrderItem) private readonly item: Model<OrderItem>;

  async create(body: any): Promise<Order> {
    return await this.model.create(body);
  }
  async createItem(body: any): Promise<OrderItem> {
    return await this.item.create(body);
  }

  async findOne(query: any): Promise<Order | undefined | null> {
    return await this.model.findOne(query);
  }

  async findAll(query: string): Promise<Order[]> {
    // console.log(this.model)
    return await this.model.find({user: query}).sort({ createdAt: -1 });
  }

  async update(query: string, body: any): Promise<Order | null> {
    return await this.model.findOneAndUpdate({ _id: query }, body, {
      new: true,
      runValidators: true,
    });
  }

  async delete(query: string): Promise<boolean | null> {
    return await this.model.findByIdAndDelete({ _id: query });
  }
}
