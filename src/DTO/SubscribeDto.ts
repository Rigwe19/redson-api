import { Required, Email } from "@tsed/schema";

export class SubscribeDto {
  @Required()
  @Email()
  email: string;

  @Required()
  frequency: string;
}
export class SubscribeResponseDto {
  success: boolean;
  message: string;
  email?: string;
}