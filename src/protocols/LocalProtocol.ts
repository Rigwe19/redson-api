import { Inject, Constant, Injectable } from "@tsed/di";
import { Unauthorized } from "@tsed/exceptions";
import { OnVerify, Protocol } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { BodyParams } from "@tsed/platform-params";
import jwt from "jsonwebtoken";
import { IStrategyOptions, Strategy } from "passport-local";
import { User } from "src/models/UserModel.js";
import { UsersService } from "src/services/UsersService.js";

@Protocol<IStrategyOptions>({
  name: "local",
  useStrategy: Strategy,
  settings: {
    usernameField: "email",
    passwordField: "password",
  },
})
@Injectable()
export class LocalProtocol implements OnVerify {
  @Inject()
  usersService: UsersService;

  @Constant("passport.protocols.jwt.settings")
  jwtSettings: any;

  async $onVerify(@Req() request: Req, @BodyParams() credentials: any) {
    const { email, password } = credentials;
    const user = await this.usersService.findOne({ email });

    if (!user) {
      throw new Unauthorized("Wrong credentials");
    }

    if (!(await this.usersService.verifyPassword(password, user.email))) {
      throw new Unauthorized("Wrong credentials");
    }

    const token = this.createJwtToken(user);

    user.token = token;
    // console.log(user, token);
    return user;
  }

  createJwtToken(user: User) {
    const { issuer, audience, secretOrKey, maxAge = 3600 } = this.jwtSettings;
    const now = Date.now();
//veekite.com.ng, tare
    return jwt.sign(
      {
        iss: issuer,
        aud: audience,
        sub: user._id,
        exp: now + maxAge * 1000,
        iat: now,
      },
      secretOrKey
    );
  }
}
