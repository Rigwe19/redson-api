import {Property, Required} from "@tsed/schema";

export class SettingsModel {
  @Property()
  @Required()
  delivery_fee: number;
}
