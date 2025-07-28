import { useDecorators, StoreSet } from "@tsed/core";
import { Middleware, UseBefore } from "@tsed/platform-middlewares";
import { Context } from "@tsed/platform-params";
import { Req, Res } from "@tsed/platform-http";
import { Forbidden } from "@tsed/exceptions";

export interface RoleGuardOptions {
  roles?: string[];
}

@Middleware()
export class RoleGuardMiddleware {
  use(@Req() req: Req, @Res() res: Res, @Context() context: Context) {
    const { roles = ["admin"] }: RoleGuardOptions =
      context.endpoint?.get(RoleGuardMiddleware) || {};
    const user = req.user;

    if (!user || !roles.includes(user.role)) {
      throw new Forbidden("Access denied.");
    }
  }
}

export function RoleGuard(
  options: RoleGuardOptions = { roles: ["admin"] }
): MethodDecorator {
  return useDecorators(
    StoreSet(RoleGuardMiddleware, options),
    UseBefore(RoleGuardMiddleware)
  );
}
