import { Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { BodyParams } from "@tsed/platform-params";
import { Description, Get, Post, Returns, Security } from "@tsed/schema";
import { User } from "src/models/UserModel.js";
import { AddressService } from "src/services/AddressService.js";
import { CartService } from "src/services/CartService.js";
import { OrderService } from "src/services/OrderService.js";
import { PaymentService } from "src/services/PaymentService.js";
class PlaceOrderResponse {
  success: boolean;
  message: string;
  data?: {
    order_id: string;
    total: number;
    items: number;
    status: string;
  };
}
@Controller("/order")
@Authenticate("jwt", { session: false })
@Security("jwt")
export class OrderController {
  @Inject()
  private readonly paymentService: PaymentService;
  @Inject()
  private readonly addressService: AddressService;
  @Inject()
  private readonly cartService: CartService;
  @Inject()
  private readonly orderService: OrderService;
  /**
   * Initializes a Paystack payment transaction.
   * @param email - The email address of the customer.
   * @param amount - The amount to be charged in kobo.
   * @param metadata - Additional metadata for the transaction.
   * @returns The Paystack payment URL.
   */
  @Post("/init")
  @Returns(200, PlaceOrderResponse)
  @Description("Paystack payment URL")
  async initializePayment(@Req("user") user: User) {
    const userId = user._id;
    // 1. Get active address
    const address = await this.addressService.findOne({
      user: userId,
      active: true,
    });
    if (!address) {
      return {
        success: false,
        message: "No active address found",
      };
    }

    // 2. Get user's cart
    const cart = await this.cartService.findOne({ user_id: userId });
    if (!cart) {
      return {
        success: false,
        message: "Cart not found",
      };
    }

    const cartItems = await this.cartService.findItemWithProduct(cart._id);
    // console.log(cartItems);
    if (!cartItems.length) {
      return {
        success: false,
        message: "Cart is empty",
      };
    }

    // 3. Calculate subtotal
    let subtotal = 0;

    const orderItems = cartItems.map((item) => {
      const product = item.product_id;
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

    // 5. Save order
    // const order = await this.orderService.create({
    //   user_id: userId,
    //   address_id: address._id,
    //   status: "pending",
    //   subtotal,
    //   delivery_fee: deliveryFee,
    //   discount,
    //   total,
    // });

    // orderItems.forEach((item) => {
    //   this.orderService.createItem({ ...item, order_id: order._id });
    // });
    // console.log(amount);
    const response = await this.paymentService.initializeTransaction({
      email: user.email,
      amount: total,
      metadata: {
        cartId: cart._id,
        // orderId: order._id,
        // items: orderItems.length,
        userId: userId,
        addressId: address._id,
      },
    });
    // console.log(response);
    if (!response.status) {
      throw new Error("Failed to initialize payment");
    }
    // Paystack returns the authorization URL in the response
    // This URL is used to redirect the user to complete the payment
    // The URL is typically in the format: https://paystack.com/transaction/initialize
    // Ensure to handle the response properly and check for errors
    if (!response.data?.authorization_url) {
      throw new Error("Authorization URL not found in Paystack response");
    }
    // Return the authorization URL to the client
    return {
      success: true,
      url: response.data?.authorization_url,
    };
  }

  @Post("/paystack-websocket")
  @Returns(200, String)
  @Description("Paystack payment URL")
  async handleWebhook(@BodyParams() body: any, @Req() req: Req) {
    // Optional: verify Paystack signature
    const event = body.event;

    if (event === "charge.success") {
      const reference = body.data.reference;

      // ✅ Verify again with Paystack (recommended)
      const verified = await this.paymentService.verifyTransaction(reference);
      const status = verified.data?.status;

      if (status === "success") {
        const metadata = verified.data?.metadata;
        const orderId = metadata?.cartId;

        // ✅ Update your DB: mark order paid, create transaction record
        // await OrderService.markAsPaid(orderId);
        // await TransactionService.recordPayment(verified.data);

        console.log("✅ Payment successful:", verified.data);
      }
    }

    return "ok";
  }

  @Post("/verify")
  @Returns(200, String)
  @Description("Paystack payment URL")
  async verify(@BodyParams("reference") reference: string) {
    const result = await this.paymentService.verifyTransaction(reference);
    const id = result.orderId
    const order = await this.orderService.getOrderDetails(id);
    return {
      order,
      success: true
    };
  }
}
