import { Forbidden } from "@tsed/exceptions";
import { Req } from "@tsed/platform-http";
import { Middleware, MiddlewareMethods } from "@tsed/platform-middlewares";
import { Context } from "@tsed/platform-params";

@Middleware()
export class RoleGuard implements MiddlewareMethods {
  use(@Req() request: any, @Context() ctx: Context) {
    const user = request.user;

    if (!user || user.role !== "admin") {
      throw new Forbidden("Access denied. Admins only.");
    }
  }
}
