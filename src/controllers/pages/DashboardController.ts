import { Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { PathParams } from "@tsed/platform-params";
import { Delete, Get, Security } from "@tsed/schema";
import { User } from "src/models/UserModel.js";
import { DashboardService } from "src/services/DashboardService.js";
import { ProductService } from "src/services/ProductService.js";

@Controller("/dashboard")
export class DashboardController {
  @Inject()
  private readonly dashboardService: DashboardService;
  @Inject()
  private readonly productService: ProductService;
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
  
    @Get("/favourites")
    @Authenticate("jwt", { session: false })
    @Security("jwt")
    async getFavourites(
      @Req("user") user: User
    ) {
      const favourites = await this.productService.getUserFavourites(user._id);
  
      return {
        success: true,
        favourites: favourites
      };
    }
  
    @Delete("/favourites/:id")
    @Authenticate("jwt", { session: false })
    @Security("jwt")
    async deleteFavourite(
      @Req("user") user: User,
      @PathParams("id") id: string
    ) {
      await this.productService.removeFromFavouritesById(id)
      const favourites = await this.productService.getUserFavourites(user._id);
  
      return {
        success: true,
        favourites: favourites
      };
    }
}
