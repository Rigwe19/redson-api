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
  // 1. Check if transaction is ALREADY processed
  const existingTransaction = await this.transaction.findOne({
    transaction_id: reference,
    status: "success",
  }).populate("order_id");

  // 1A. If already processed → DO NOT re-create order or deduct inventory
  if (existingTransaction) {
    return {
      status: "success",
      message: "Transaction already processed",
      data: existingTransaction,
      orderId: existingTransaction.order_id.toString(),
    };
  }

  // 2. Verify from Paystack
  const paystack = await this.paystack.transaction.verify(reference);

  if (!paystack.status || paystack.data?.status !== "success") {
    throw new Error("Payment verification failed");
  }

  // Extract metadata
  const metadata = paystack.data.metadata;
  if (!metadata) throw new Error("Payment metadata missing");

  const { cartId, userId, addressId } = metadata;

  // 3. Fetch user
  const user = await this.user.findById(userId);
  if (!user) throw new Error("User not found");

  // 4. Fetch cart items
  const cartItems = await this.cartItem
    .find({ cart_id: cartId })
    .populate("product_id");

  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart not found or empty");
  }

  // 5. Build order items & calculate subtotal
  let subtotal = 0;
  const orderItems = cartItems.map((item) => {
    const product = item.product_id as any;
    if (!product || typeof product === "string") {
      throw new Error("Product not populated");
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

  // 6. Fees
  const deliveryFee = 3000;
  const discount = 0;
  const total = subtotal + deliveryFee - discount;

  // 7. Create order
  const order = await this.order.create({
    user_id: user._id,
    address_id: addressId,
    status: "pending",
    subtotal,
    delivery_fee: deliveryFee,
    discount,
    total,
    paidAt: new Date(),
  });

  // 8. Create order item records + reduce product inventory
  for (const item of orderItems) {
    await this.orderItem.create({ ...item, order_id: order._id });

    await this.product.updateOne(
      { _id: item.product_id },
      { $inc: { inventory: -item.quantity } }
    );
  }

  // 9. Create transaction & save name, phone, amount
  await this.transaction.create({
    user_id: user._id,
    order_id: order._id,
    amount: paystack.data.amount / 100,
    payment_method: "paystack",
    status: "success",
    transaction_id: reference,
    authorization: paystack.data.authorization,

    // ⭐ Saved from User model
    name: `${user.firstName} ${user.lastName}`,
    phone: user.phoneNumber,
  });

  // 10. Cleanup cart
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
