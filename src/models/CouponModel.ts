import { ObjectID } from "@tsed/mongoose";
import {Enum, Property} from "@tsed/schema";

export class CouponModel {
  @Property()
  @ObjectID("id")
  _id: string;

  @Property()
  code: string;

  @Property()
  value: number;

  @Property()
  expiresAt: Date;
  
  @Property()
  @Enum(["percent", "fixed"])
  discount_type: "percent" | "fixed";

  @Property()
  expires_at: Date;

  @Property()
  usage_limit: number;

  @Property()
  used_count: number;
}
