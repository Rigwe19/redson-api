import { join } from "node:path";
import { Configuration } from "@tsed/di";
import { application } from "@tsed/platform-http";
import "@tsed/mongoose";
import "@tsed/platform-log-request"; // remove this import if you don&#x27;t want log request
import "@tsed/platform-koa"; // /!\ keep this import
import "@tsed/ajv";
import "@tsed/swagger";
import "@tsed/platform-multer/koa"
import { config } from "./config/index.js";
import * as rest from "./controllers/rest/index.js";
import * as pages from "./controllers/pages/index.js";
// import session from "express-session";
import "./protocols";

@Configuration({
  ...config,
  acceptMimes: ["application/json"],
  httpPort: process.env.PORT ?? 8083,
  httpsPort: false, // CHANGE
  mount: {
    "/rest": [...Object.values(rest)],
    "/": [...Object.values(pages)],
  },
  multer: {
    dest: "./uploads",
  },
  mongoose: [
    {
      id: "default", // Recommended: define default connection. All models without dbName will be assigned to this connection
      url: "mongodb://127.0.0.1:27017/redson",
      connectionOptions: {},
    },
    // {
    //   id: "db2",
    //   url: "mongodb://127.0.0.1:27017/db2",
    //   connectionOptions: {},
    // },
  ],
  swagger: [
    {
      path: "/doc",
      specVersion: "3.0.1",
    },
  ],
  middlewares: [
    "@koa/cors",
    "koa-compress",
    "koa-override",
    "koa-bodyparser",
    // session({
    //   secret: "redTopSecSon",
    //   resave: true,
    //   saveUninitialized: true,
    // })
  ],
  views: {
    root: join(process.cwd(), "../views"),
    extensions: {
      ejs: "ejs",
    },
  },
})
export class Server {
  protected app = application();
}
