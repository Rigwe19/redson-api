import { Controller, Inject } from "@tsed/di";
import { BodyParams } from "@tsed/platform-params";
import { Get, Post, Returns, Security, Summary } from "@tsed/schema";
import { ContactDto } from "src/DTO/ContactDto.js";
import { DistributorDto } from "src/DTO/DistributorDto.js";
import { SubscribeDto } from "src/DTO/SubscribeDto.js";
import { StatusCodes } from "http-status-codes";
import { ContactService } from "src/services/ContactService.js";
import { Authenticate } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { User } from "src/models/UserModel.js";

@Controller("/public")
export class OtherController {
  @Inject()
  private readonly contactService: ContactService;
  @Post("/contact")
  @Summary("Collect contact details")
  @(Returns(StatusCodes.OK).Description("Contact collected successfully"))
  async getContact(@BodyParams() body: ContactDto) {
    await this.contactService.handleContact(body);
    return {
      success: true,
      message:
        "We have gotten your message!, we would get back to you shortly.",
    };
  }

  @Post("/subscribe")
  @Summary("Subscribe user")
  @(Returns(StatusCodes.CREATED).Description("User subscribed"))
  async createSubscriber(@BodyParams() dto: SubscribeDto) {
    await this.contactService.subscriber(dto);
    return {
      success: true,
      message:
        "Thank you for subscribing! you'll receive updates from us shortly.",
    };
  }

  @Post("/unsubscribe")
  @Summary("unSubscribe user")
  @(Returns(StatusCodes.CREATED).Description("User unsubscribed"))
  async unSubscriber(@BodyParams('email') email: string) {
    await this.contactService.unsubscribe(email);
    return {
      success: true,
      message:
        "You have been successfully removed from our newsletter",
    };
  }

  @Get("/subscribe")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  @Summary("Get Subscribe user")
  @(Returns(StatusCodes.OK).Description("User Retrieved"))
  async getSubscriber(@Req("user") user: User) {
    const sub = await this.contactService.getSubscriber(user.email);
    return {
      success: !!sub,
      frequency: sub,
    };
  }

  @Post("/distributor")
  @Summary("Create new distributor")
  @(Returns(StatusCodes.CREATED).Description("Partner Added Successfully"))
  async createDistributor(@BodyParams() dto: DistributorDto) {
    const dist = await this.contactService.createDistributor(dto);
    return {
      success: true,
      message: "Partner Added Successfully",
      dist,
    };
  }
}
