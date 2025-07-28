import { Required, Email, MinLength, MaxLength } from "@tsed/schema";

export class ContactDto {
  @Required()
  @MinLength(2)
  @MaxLength(50)
  first_name: string;

  @Required()
  @MinLength(2)
  @MaxLength(50)
  last_name: string;

  @Required()
  @Email()
  email: string;

  @Required()
  @MinLength(8)
  phone: string;

  @Required()
  message: string;

  @Required()
  gender: "male" | "female" | "other";
}
export class ContactResponseDto {
  success: boolean;
  message: string;
  contact?: ContactDto;
  error?: string;
}