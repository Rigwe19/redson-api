import {Inject, Injectable} from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { Model } from "mongoose";
import { Contact } from "src/models/ContactModel.js";
import { Partner } from "src/models/PartnerModel.js";
import { Subscribe } from "src/models/SubscribeModel.js";
import { MailService } from "./MailService.js";

@Injectable()
export class ContactService {
    @Inject(Subscribe) private readonly subscribe: Model<Subscribe>;
    @Inject(Contact) private readonly contact: Model<Contact>;
    @Inject(Partner) private readonly partner: Model<Partner>;
    @Inject()
    private readonly mailService: MailService;

async handleContact(body: any) {
    const requiredFields = ["fullName","email", "phone", "message"];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new BadRequest("Please fill all the fields");
      }
    }

    const subscriber = await this.contact.create(body);
    await this.mailService.sendContactNotification("info@allagesbyredson.com", body);

    return subscriber;
  }

  async subscriber(email: string) {
    if (!email) {
      throw new BadRequest("Please fill in email field");
    }

    const subscriber = await this.subscribe.findOneAndUpdate({ email }, {
      $set: {email}
    });
    await this.mailService.sendSubscription(email, { email });
    await this.mailService.sendSubscriptionNotification("info@allagesbyredson.com", { email });

    return subscriber;
  }

  async createDistributor(data: any) {
    const requiredFields = [
      "first_name", "last_name", "email", "phone",
      "address", "city", "state", "country", "company"
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new BadRequest("Please fill all the fields");
      }
    }

    const partner = await this.partner.create(data);
    // await sendDistributorDetails(data);
    return partner;
  }
}
