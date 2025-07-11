import { Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Delete, Get, Patch, Post, Security } from "@tsed/schema";
import { Address } from "src/models/AddressModel.js";
import { User } from "src/models/UserModel.js";
import { AddressService } from "src/services/AddressService.js";

@Controller("/address")
export class AddressController {
  @Inject()
  private readonly addressService: AddressService;

  @Post("/create")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async createAddress(@BodyParams() address: Address, @Req("user") user: User) {
    address.user = user
    const save = await this.addressService.create(address);
    return {
      success: true,
      address: save,
      add: address,
      user
    };
  }

  @Get("/all")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async allAddresses(@Req("user") user: User) {
    const addresses = await this.addressService.findAll(user._id);
    return {
      success: true,
      addresses,
    };
  }

  @Patch("/")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async updateAddress(@BodyParams() input: Address) {
    const address = this.addressService.update(input._id, input);
    return {
      success: true,
      address,
    };
  }

  @Get("/:id")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async getSingleAddress(@PathParams("id") id: string) {
    const address = await this.addressService.findOne({ id });

    if (!address) {
      return { success: false, message: `No address with id : ${id}` };
    }

    return {
      success: true,
      address,
    };
  }

  @Delete("/:id")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async deleteAddress(@PathParams("id") id: string) {
    const address = await this.addressService.delete(id);

    if (!address) {
      return { success: false, message: `No address with id : ${id}` };
    }

    return {
      success: true,
      message: "Address Deleted",
    };
  }
}
