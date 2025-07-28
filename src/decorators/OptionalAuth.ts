import {useDecorators, StoreSet} from "@tsed/core";
import { Middleware, UseBefore } from "@tsed/platform-middlewares";
import {Context} from "@tsed/platform-params";
import {Next, Req, Res} from "@tsed/platform-http";
import passport from "passport";

export interface OptionalAuthOptions {

}

@Middleware()
export class OptionalAuthMiddleware {
  use(@Req() req: Req, @Res() res: Res, @Context() context: Context, @Next() next: Next) {
    // const {}: OptionalAuthOptions = context.endpoint.get(OptionalAuthMiddleware);
    return new Promise<void>((resolve) => {
      passport.authenticate("jwt", { session: false }, (err: any, user: any, info: any) => {
        if (user) {
          context.set("user", user); // Inject user into context
        } else {
          context.set("user", null);
        }
        resolve();
      })(req);
    }).then(() => next());
  }
}

export function OptionalAuth(options?: OptionalAuthOptions): MethodDecorator {
  return useDecorators(
    StoreSet(OptionalAuthMiddleware, options),
    UseBefore(OptionalAuthMiddleware)
  );
}
