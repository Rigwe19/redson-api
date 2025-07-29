import { Injectable } from "@tsed/di";
import fs from "fs/promises";
import handlebars from "handlebars";
import path from "node:path";
import nodemailer from "nodemailer";



@Injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!) || 587,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  private readonly defaultFrom = process.env.SMTP_FROM!;


  private async renderTemplate(templateName: string, context: any) {
    const { compile } = handlebars;
    const templatePath = path.resolve("emails", `${templateName}.hbs`);
    const source = await fs.readFile(templatePath, "utf8");
    const compiled = compile(source);
    return compiled(context);
  }

  async sendWelcomeEmail(to: string, name: string) {
    const html = await this.renderTemplate("welcome", { name });

    return this.transporter.sendMail({
      from: this.defaultFrom,
      to,
      subject: "Welcome to Redson",
      html,
    });
  }

  async sendOrderConfirmation(orderData: any) {
    const html = await this.renderTemplate("orderDetailsAdmin", orderData);

    return this.transporter.sendMail({
      from: this.defaultFrom,
      to: process.env.SMTP_FROM,
      subject: "New Order Notification",
      html,
    });
  }

  async sendOrderNotification(to: string, orderData: any) {
    const html = await this.renderTemplate("orderConfirmation", orderData);

    return this.transporter.sendMail({
      from: this.defaultFrom,
      to,
      subject: "Order Confirmation",
      html,
    });
  }

  async sendPasswordReset(to: string, body: {otp: string; name: string}) {
    const html = await this.renderTemplate("resetPassword", {name: body.name, codeSplits: body.otp.split("")});

    return this.transporter.sendMail({
      from: this.defaultFrom,
      to,
      subject: "Reset Your Password",
      html,
    });
  }

  async sendSubscription(to: string, subscriber: { email: string }) {
    const html = await this.renderTemplate("newSubscriber", subscriber);

    return this.transporter.sendMail({
      from: this.defaultFrom,
      to,
      subject: "Newsletter Subscription Confirmation",
      html,
    });
  }

  async sendSubscriptionNotification(to: string, subscriber: { email: string }) {
    const html = await this.renderTemplate("newSubscriberNotification", { email: subscriber.email });

    return this.transporter.sendMail({
      from: this.defaultFrom,
      to,
      subject: "New Newsletter Subscriber",
      html,
    });
  }
}
