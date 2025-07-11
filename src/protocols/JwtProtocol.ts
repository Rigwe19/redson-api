import { Inject } from "@tsed/di";
import { Unauthorized } from "@tsed/exceptions";
import { Arg, OnVerify, Protocol } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "src/services/UsersService.js";

// Extend the Req interface to include the 'user' property
declare module "@tsed/platform-http" {
  interface Req {
    user?: any;
  }
}

@Protocol({
  name: "jwt",
  useStrategy: Strategy,
  settings: {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    issuer: "localhost",
    audience: "localhost",
  },
})
export class JwtProtocol implements OnVerify {
  @Inject()
  usersService: UsersService;

  async $onVerify(@Req() req: Req, @Arg(0) jwtPayload: any) {
    const user = await this.usersService.findOne({
      _id: jwtPayload.sub,
    });

    if (!user) {
      throw new Unauthorized("Invalid token");
    }

    req.user = user;

    return user;
  }
}
