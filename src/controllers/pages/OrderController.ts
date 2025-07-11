import { Controller, Inject } from "@tsed/di";
import { Req } from "@tsed/platform-http";
import { BodyParams } from "@tsed/platform-params";
import { Get, Post, Returns } from "@tsed/schema";
import { PaymentService } from "src/services/PaymentService.js";

@Controller("/order")
export class OrderController {
  @Inject()
  private readonly paymentService: PaymentService;
  /**
   * Initializes a Paystack payment transaction.
   * @param email - The email address of the customer.
   * @param amount - The amount to be charged in kobo.
   * @param metadata - Additional metadata for the transaction.
   * @returns The Paystack payment URL.
   */
  @Post("/init")
  @(Returns(200, String).Description("Paystack payment URL"))
  async initializePayment(
    @BodyParams() body: any,
    @BodyParams("email") email: string,
    @BodyParams("amount") amount: number,
    @BodyParams("metadata") metadata: any
  ) {
    console.log(amount)
    const response = await this.paymentService.initializeTransaction({
      email,
      amount,
      metadata,
    });
    console.log(response)
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
    return response.data?.authorization_url;
  }

  @Post("/")
  @(Returns(200, String).Description("Paystack payment URL"))
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
  @(Returns(200, String).Description("Paystack payment URL"))
  async verify(@BodyParams("reference") reference: string) {
    const result = await this.paymentService.verifyTransaction(reference);
    return result.data;
  }
}
