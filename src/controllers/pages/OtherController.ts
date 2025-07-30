import {Controller, Inject} from "@tsed/di";
import { BodyParams } from "@tsed/platform-params";
import {Get, Post, Returns, Summary} from "@tsed/schema";
import { ContactDto } from "src/DTO/ContactDto.js";
import { DistributorDto } from "src/DTO/DistributorDto.js";
import { SubscribeDto } from "src/DTO/SubscribeDto.js";
import { StatusCodes } from "http-status-codes";
import { ContactService } from "src/services/ContactService.js";

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
      message: "We have gotten your message!, we would get back to you shortly."
    };
  }

  @Post("/subscribe")
  @Summary("Subscribe user")
  @(Returns(StatusCodes.CREATED).Description("User subscribed"))
  async getSubscriber(@BodyParams() dto: SubscribeDto) {
    await this.contactService.subscriber(dto.email);
    return {
      success: true,
      message: "Thank you for subscribing! you'll receive updates from us shortly."
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
      dist
    };
  }
}
