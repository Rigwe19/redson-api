import { Inject, Injectable } from "@tsed/di";
import { Model } from "mongoose";
import { Address } from "src/models/AddressModel.js";

@Injectable()
export class AddressService {
  @Inject(Address) private readonly model: Model<Address | null>;

  async create(body: any): Promise<Address> {
    const { user, ...dataWithoutId } = body;
    if (body._id) {
      dataWithoutId._id = body._id;
    }

    // console.log(dataWithoutId, user);

    if (body.active) {
      await this.model.findOneAndUpdate(
        { user: body.user, active: true },
        { active: false }
      );
    }
    const existingDoc = await this.model.findOne({
      _id: body._id,
      user: body.user,
    });

    // return await this.model.findOneAndUpdate({ _id: body._id, user }, body, {
    //   new: true,
    //   upsert: true,
    //   setDefaultsOnInsert: true,
    // });
    if (existingDoc) {
      const updatedDoc = await this.model.findOneAndUpdate(
        { _id: body._id, user: body.user },
        body,
        { new: true }
      );
      if (!updatedDoc) throw new Error("Failed to update address");
      return updatedDoc;
    } else {
      return await this.model.create(body);
    }
  }

  async findOne(query: any): Promise<Address | undefined | null> {
    return await this.model.findOne(query);
  }

  async findAll(query: string): Promise<Address[]> {
    // console.log(this.model)
    return await this.model.find({ user: query }).sort({ createdAt: -1 });
  }

  async update(
    user: string,
    id: string,
    body: any
  ): Promise<Address | null | undefined> {
    try {
      const deleted = await this.model.findOneAndUpdate(
        { user, active: true },
        { $set: { active: false } },
        {
          new: true,
          runValidators: true,
        }
      );
      const result = await this.model.findOneAndUpdate(
        { _id: id },
        { $set: body },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log("Result:", deleted);
      return result;
    } catch (error) {
      console.error(error);
      // Handle the error accordingly
    }
  }

  async delete(query: string): Promise<boolean | null> {
    return await this.model.findByIdAndDelete({ _id: query });
  }
}
