import {readFileSync} from "node:fs";
import {envs} from "./envs/index.js";
import loggerConfig from "./logger/index.js";
import { User } from "src/models/UserModel.js";
const pkg = JSON.parse(readFileSync("./package.json", {encoding: "utf8"}));

export const config: Partial<TsED.Configuration> = {
  version: pkg.version,
  envs,
  ajv: {
    returnsCoercedValues: true,
    verbose: false,
    keywords: [],
  },
  logger: loggerConfig,
  passport: {
    disableSession: true,
    userInfoModel: User
  },
  // additional shared configuration
};
