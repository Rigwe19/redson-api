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
    const trans = await this.transaction.findOne({
      reference,
      status: "success",
    });
    const paystack = await this.paystack.transaction.verify(reference);
    if (trans) {
      return {
        status: paystack.status ? "success" : "failed",
        message: paystack.message,
        data: paystack.data,
        orderId: trans.order_id.toString(),
      };
    }
    if (paystack.status && paystack.data?.status === "success") {
      // const orderId = paystack.data?.metadata?.orderId;
      const addressId = paystack.data?.metadata?.addressId;
      const cart = paystack.data?.metadata?.cartId;
      const user = await this.user.findById(paystack.data.metadata.userId);
      if (!user) {
        throw new Error("User not found");
      }
      const cartItems = await this.cartItem
        .find({ cart_id: cart })
        .populate("product_id");
      let subtotal = 0;

      const orderItems = cartItems.map((item) => {
        const product = item.product_id as Product;
        if (typeof product !== "string") {
          const unitPrice = product.price;
          const itemTotal = unitPrice * item.quantity;
          // console.log(unitPrice, product, item.quantity, itemTotal);
          subtotal += itemTotal;

          return {
            product_id: product._id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            unit_price: unitPrice,
          };
        } else {
          throw new Error("Product is not populated");
        }
      });

      // 4. Calculate delivery & discount (customize logic if needed)
      const deliveryFee = 3000;
      const discount = 0;
      const total = subtotal + deliveryFee - discount;
      const order = await this.order.create({
        user_id: user._id,
        address_id: addressId,
        status: "pending",
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
      });
      await this.transaction.updateOne(
        { transaction_id: reference, order_id: order._id },
        {
          $set: {
            status: "success",
            authorization: paystack.data.authorization,
          },
        }
      );
      orderItems.forEach(async (item) => {
        await this.orderItem.create({ ...item, order_id: order._id });
        await this.product.updateOne(
          { _id: item.product_id },
          { $inc: { inventory: -item.quantity } }
          // [
          //   {
          //     $set: {
          //       variants: {
          //         $map: {
          //           input: "$variants",
          //           in: {
          //             $cond: [
          //               { $eq: ["$$this._id", variantId] },
          //               {
          //                 $mergeObjects: [
          //                   "$$this",
          //                   {
          //                     stock: { $substract: ["$$this.stock", quantity] },
          //                   },
          //                 ],
          //               },
          //               "$$this",
          //             ],
          //           },
          //         },
          //       },
          //     },
          //   },
          // ],
          // { arrayFilters: [{ "elem._id": variantId }] }
        );
      });
      // console.log(user, )
      await this.order.updateOne(
        { _id: order },
        { $set: { paidAt: new Date() } }
      );
      await this.cart.deleteOne({ _id: cart });
      await this.cartItem.deleteMany({ cart_id: cart });
      await this.mailService.sendOrderNotification(user.email, {
        name: user.firstName,
        id: order,
        amount: paystack.data.amount,
      });

      await this.mailService.sendOrderConfirmation({
        name: user?.firstName,
        id: order,
        amount: paystack.data.amount,
      });

      return {
        status: paystack.status ? "success" : "failed",
        message: paystack.message,
        data: paystack.data,
        orderId: order._id,
      };
    }
    throw new Error("Payment not successful");
  }
}
