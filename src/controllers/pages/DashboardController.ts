import { Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { PathParams } from "@tsed/platform-params";
import { Delete, Get, Returns, Security } from "@tsed/schema";
import { User } from "src/models/UserModel.js";
import { DashboardService } from "src/services/DashboardService.js";
import { OrderService } from "src/services/OrderService.js";
import { ProductService } from "src/services/ProductService.js";

@Controller("/dashboard")
export class DashboardController {
  @Inject()
  private readonly dashboardService: DashboardService;
  @Inject()
  private readonly productService: ProductService;
  @Inject()
  private readonly orderService: OrderService;
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  @Get("/views")
  async getViews(@Req("user") user: User) {
    const views = await this.dashboardService.getViews(user._id);
    return {
      success: true,
      views,
    };
  }

  @Get("/orders")
  @Returns(200, Object)
  async getOrders(@Req("user") user: User) {
    const orders = await this.orderService.findAll(user._id);
    return { success: true, message: "Success", orders };
  }

  @Get("/favourites")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async getFavourites(@Req("user") user: User) {
    const favourites = await this.productService.getUserFavourites(user._id);

    return {
      success: true,
      favourites: favourites,
    };
  }

  @Delete("/favourites/:id")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async deleteFavourite(@Req("user") user: User, @PathParams("id") id: string) {
    await this.productService.removeFromFavouritesById(id);
    const favourites = await this.productService.getUserFavourites(user._id);

    return {
      success: true,
      favourites: favourites,
    };
  }
}
