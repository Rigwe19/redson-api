import { Inject, Injectable } from "@tsed/di";
import type { MongooseModel } from "@tsed/mongoose";
import { Paystack } from "paystack-sdk";
import { CartItem } from "src/models/CartItemModel.js";
import { Cart } from "src/models/CartModel.js";
import { Order } from "src/models/OrderModel.js";
import { Transaction } from "src/models/TransactionModel.js";
import { MailService } from "./MailService.js";
import { User } from "src/models/UserModel.js";
import { Product } from "src/models/ProductModel.js";
import { OrderItem } from "src/models/OrderItemModel.js";

@Injectable()
export class PaymentService {
  private readonly paystack: InstanceType<typeof Paystack>;

  @Inject(Transaction) private readonly transaction: MongooseModel<Transaction>;
  @Inject(Order) private readonly order: MongooseModel<Order>;
  @Inject(Cart) private readonly cart: MongooseModel<Cart>;
  @Inject(User) private readonly user: MongooseModel<User>;
  @Inject(Product) private readonly product: MongooseModel<Product>;
  @Inject(CartItem) private readonly cartItem: MongooseModel<CartItem>;
  @Inject(OrderItem) private readonly orderItem: MongooseModel<OrderItem>;
  @Inject() private readonly mailService: MailService;

  constructor() {
    this.paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY_TEST!);
  }

  async initializeTransaction(data: {
    email: string;
    amount: number;
    metadata?: any;
  }): Promise<{ status: boolean; message: string; data: any }> {
    const paystack = await this.paystack.transaction.initialize({
      email: data.email,
      amount: (data.amount * 100).toString(), // Paystack expects amount in kobo
      metadata: data.metadata,
    });
    await this.transaction.create({
      status: "pending",
      amount: data.amount,
      order_id: data.metadata.orderId,
      user_id: data.metadata.userId,
      payment_method: "paystack",
      transaction_id: paystack.data?.reference,
    });

    return paystack;
  }

  async verifyTransaction(
    reference: string
  ): Promise<{ status: string; message: string; data: any; orderId: string }> {
    // 1. Verify with Paystack
    const paystack = await this.paystack.transaction.verify(reference);

    // 2. Check if transaction already processed
    const existingTrans = await this.transaction.findOne({
      transaction_id: reference,
      status: "success",
    });

    if (existingTrans) {
      // Return existing order, do not recreate anything
      return {
        status: "success",
        message: "Transaction already processed",
        data: paystack.data,
        orderId: existingTrans.order_id.toString(),
      };
    }

    // 3. Paystack says unsuccessful
    if (!paystack.status || paystack.data?.status !== "success") {
      throw new Error("Payment not successful");
    }

    // 4. Continue only if this is a NEW successful payment
    const meta = paystack.data.metadata;
    const addressId = meta.addressId;
    const cartId = meta.cartId;

    const user = await this.user.findById(meta.userId);
    if (!user) throw new Error("User not found");

    const cartItems = await this.cartItem
      .find({ cart_id: cartId })
      .populate("product_id");

    if (!cartItems.length) throw new Error("Cart not found or empty");

    // 5. Build order items
    let subtotal = 0;

    const orderItems = cartItems.map((item) => {
      const product = item.product_id as Product;

      if (typeof product === "string") {
        throw new Error("Product is not populated");
      }

      const unitPrice = product.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      return {
        product_id: product._id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        unit_price: unitPrice,
      };
    });

    const deliveryFee = 3000;
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    // 6. Create order
    const order = await this.order.create({
      user_id: user._id,
      address_id: addressId,
      status: "pending",
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total,
    });

    // 7. Create transaction record
    await this.transaction.create({
      transaction_id: reference,
      order_id: order._id,
      status: "success",
      authorization: paystack.data.authorization,
    });

    // 8. Create order items + update inventory
    for (const item of orderItems) {
      await this.orderItem.create({ ...item, order_id: order._id });
      await this.product.updateOne(
        { _id: item.product_id },
        { $inc: { inventory: -item.quantity } }
      );
    }

    // 9. Mark order as paid
    await this.order.updateOne(
      { _id: order._id },
      { $set: { paidAt: new Date() } }
    );

    // 10. Clear cart
    await this.cart.deleteOne({ _id: cartId });
    await this.cartItem.deleteMany({ cart_id: cartId });

    return {
      status: "success",
      message: paystack.message,
      data: paystack.data,
      orderId: order._id.toString(),
    };
  }
}
