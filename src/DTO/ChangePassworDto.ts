import { Property, Required } from "@tsed/schema";

export class ChangePasswordDto {
  @Required()
  newPassword: string;

  @Required()
  currentPassword: string;
}