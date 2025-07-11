import { Inject, Injectable } from "@tsed/di";
import { Model } from "mongoose";
import { Address } from "src/models/AddressModel.js";

@Injectable()
export class AddressService {
  @Inject(Address) private readonly model: Model<Address>;

  async create(body: any): Promise<Address> {
    if(body.active){
        await this.model.findOneAndUpdate({ user: body.user, active: true }, { active: false });
    }
    return await this.model.create(body);
  }

  async findOne(query: any): Promise<Address | undefined | null> {
    return await this.model.findOne(query);
  }

  async findAll(query: string): Promise<Address[]> {
    // console.log(this.model)
    return await this.model.find({user: query}).sort({ createdAt: -1 });
  }

  async update(query: string, body: any): Promise<Address | null> {
    return await this.model.findOneAndUpdate({ _id: query }, body, {
      new: true,
      runValidators: true,
    });
  }

  async delete(query: string): Promise<boolean | null> {
    return await this.model.findByIdAndDelete({ _id: query });
  }
}
