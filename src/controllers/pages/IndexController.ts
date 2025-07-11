import { Constant, Controller } from "@tsed/di";
import { HeaderParams } from "@tsed/platform-params";
import { View } from "@tsed/platform-views";
import { SwaggerSettings } from "@tsed/swagger";
import { Hidden, Get, Returns } from "@tsed/schema";

@Hidden()
@Controller("/")
export class IndexController {
  @Constant("swagger")
  private swagger: SwaggerSettings[] | undefined;

  @Get("/")
  @View("swagger.ejs")
  @(Returns(200, String).ContentType("text/html"))
  get(@HeaderParams("x-forwarded-proto") protocol: string, @HeaderParams("host") host: string) {
    const hostUrl = `${protocol || "http"}://${host}`;
    
    const docs = (this.swagger ?? []).map((conf) => ({
      url: hostUrl + conf.path,
      ...conf,
    }));

    return {
      BASE_URL: hostUrl,
      docs,
    };
  }
}