import { Injectable } from "@tsed/di";
import { Paystack } from "paystack-sdk";

@Injectable()
export class PaymentService {
  private readonly paystack: InstanceType<typeof Paystack>;

  constructor() {
    this.paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY_TEST!);
  }

  async initializeTransaction(data: {
    email: string;
    amount: number;
    metadata?: any;
  }): Promise<{ status: boolean; message: string; data: any }>  {
    return this.paystack.transaction.initialize({
      email: data.email,
      amount: (data.amount * 100).toString(), // Paystack expects amount in kobo
      metadata: data.metadata,
    });
  }

  async verifyTransaction(reference: string): Promise<{ status: boolean; message: string; data: any }>  {
    return this.paystack.transaction.verify(reference);
  }
}
