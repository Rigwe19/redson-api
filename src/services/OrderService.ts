import { Inject, Injectable } from "@tsed/di";
import type { MongooseModel } from "@tsed/mongoose";
import { Address } from "src/models/AddressModel.js";
import { OrderItem } from "src/models/OrderItemModel.js";
import { Order } from "src/models/OrderModel.js";
import { Product } from "src/models/ProductModel.js";
import { User } from "src/models/UserModel.js";
import { addBusinessDays } from "date-fns";
import { Transaction } from "src/models/TransactionModel.js";

@Injectable()
export class OrderService {
  @Inject(Order) private readonly model: MongooseModel<Order>;
  @Inject(OrderItem) private readonly item: MongooseModel<OrderItem>;
  @Inject(Transaction) private readonly transaction: MongooseModel<Transaction>;

  async create(body: any): Promise<Order> {
    return await this.model.create(body);
  }
  async createItem(body: any): Promise<OrderItem> {
    return await this.item.create(body);
  }

  async findOne(query: any): Promise<Order | undefined | null> {
    return await this.model.findOne(query);
  }

  async findAll(query?: string): Promise<any[]> {
    const filter: any = {};

    if (query) {
      filter["order_id.user_id"] = query;
    }
    console.log(filter);
    const transactions = await this.transaction
      .find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "order_id",
        populate: {
          path: "user_id",
          select: "firstName lastName",
        },
      })
      .populate({
        path: "user_id",
        select: "firstName lastName",
      })
      .lean();

    // console.log(transactions);
    return transactions.map((transaction) => {
      const order = transaction.order_id as Order;
      const user = transaction.user_id as User;

      return {
        transactionId: transaction.transaction_id,
        payment_id: transaction._id,
        id: order._id,
        status: order.status,
        total: order.total,
        customer: `${user?.firstName || ""} ${user?.lastName || ""}`,
      };
    });
  }

  async getOrderDetails(orderId: string) {
    const order = await this.model
      .findById(orderId)
      .populate("user_id", "firstName lastName email")
      .populate("address_id")
      .lean();

    if (!order) throw new Error("Order not found");

    const orderItems = await this.item
      .find({ order_id: order._id })
      .populate("product_id", "name images basePrice brand")
      .lean();

    const items = orderItems.map((item) => {
      const product = item.product_id as Product;
      return {
        id: item._id,
        name: product.name,
        image: product.images[0].url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        color: item.color,
        size: item.size,
        total_price: item.unit_price * item.quantity,
      };
    });
    const user = order.user_id as User;
    const address = order.address_id as Address;

    return {
      orderId: order._id,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      delivery_fee: order.delivery_fee,
      total: order.total,
      createdAt: order.createdAt,
      lastUpdated: order.updatedAt,
      estimatedDelivery: addBusinessDays(order.createdAt, 2),
      customer: {
        _id: user?._id,
        fullName: `${user?.firstName || ""} ${user?.lastName || ""}`,
        email: user?.email || "",
      },
      address: {
        fullName: `${address?.firstName || ""} ${address?.lastName || ""}`,
        address: address?.address,
        city: address?.city,
        state: address?.state,
        country: address?.country,
        phone: address?.phone,
        // company: address?.company || "",
      },
      items,
    };
  }

  async getPaymentDetails(transactionId: string) {
    const transaction = await this.transaction
      .findById(transactionId)
      .populate("user_id", "firstName lastName email")
      // .populate("address_id")
      .populate("order_id")
      .lean();

    if (!transaction) throw new Error("Transaction not found");

    const orderItems = await this.item
      .find({ order_id: transaction.order_id })
      .populate("product_id", "name images basePrice brand")
      .lean();

    const items = orderItems.map((item) => {
      const product = item.product_id as Product;
      return {
        id: item._id,
        name: product.name,
        image: product.images[0].url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        color: item.color,
        size: item.size,
        total_price: item.unit_price * item.quantity,
      };
    });
    const user = transaction.user_id as User;
    const order = await this.model
      .findById(transaction.order_id)
      .populate("address_id")
      .lean();

    // if (!order) throw new Error("Order not found");

    const address = order?.address_id as Address;

    return {
      ...transaction,
      order,
      customer: {
        _id: user?._id,
        fullName: `${user?.firstName || ""} ${user?.lastName || ""}`,
        email: user?.email || "",
      },
      address: {
        fullName: `${address?.firstName || ""} ${address?.lastName || ""}`,
        address: address?.address,
        city: address?.city,
        state: address?.state,
        country: address?.country,
        phone: address?.phone,
        // company: address?.company || "",
      },
      items,
    };
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
