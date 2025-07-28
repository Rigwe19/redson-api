import { Required, Email } from "@tsed/schema";

export class DistributorDto {
  @Required()
  first_name: string;

  @Required()
  last_name: string;

  @Required()
  @Email()
  email: string;

  @Required()
  phone: string;

  @Required()
  address: string;

  @Required()
  city: string;

  @Required()
  state: string;

  @Required()
  country: string;

  @Required()
  company: string;
}
export class DistributorResponseDto {
  success: boolean;
  message: string;
  distributor?: DistributorDto;
  error?: string;
}