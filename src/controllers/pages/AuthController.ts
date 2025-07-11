import { Constant, Controller, Inject } from "@tsed/di";
import { BodyParams } from "@tsed/platform-params";
import { boolean, Get, Groups, Post, Returns, Security } from "@tsed/schema";
import { User } from "../../models/UserModel.js";
import { UsersService } from "src/services/UsersService.js";
import { Authenticate } from "@tsed/passport";
import jwt from "jsonwebtoken";
import { Req } from "@tsed/platform-http";

@Controller("/auth")
export class AuthController {
  @Inject()
  private readonly usersService: UsersService;
  @Constant("passport.protocols.jwt.settings")
  jwtSettings: any;

  @Post("/register")
  // @Authenticate("local", {session: false})
  // @Returns(200, User).Groups("token", "info")
  // @Returns(200, {success: boolean, user: UserModel})
  async register(@BodyParams() user: User) {
    const save = await this.usersService.create(user);
    if (!save) {
      return {
        success: false,
      };
    }

    // Generate JWT token
    const { issuer, audience, secretOrKey, maxAge = 3600 } = this.jwtSettings;
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: issuer,
        aud: audience,
        sub: save._id,
        exp: now + maxAge,
        iat: now,
      },
      secretOrKey
    );
    return {
      success: true,
      // user: {...user, ...save},
      save,
      user,
      token,
    };
  }
  @Post("/login")
  @Authenticate("local", { session: false })
  @(Returns(200, User).Groups("token", "info"))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login(
    @Req("user") user: User,
    @BodyParams() @Groups("credentials") credentials: User
  ) {
    return user;
  } 

  @Get("/userinfo")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  @(Returns(200, User).Groups("info"))
  getUserInfo(@Req("user") user: User) {
    return user;
  }

  @Get("/users")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  // @(Returns(200, User[]).Groups("info"))
  async allUser() {
    const users = await this.usersService.findAll();
    return users;
  }
}
