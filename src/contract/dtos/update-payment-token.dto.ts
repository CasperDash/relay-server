import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class UpdatePaymentTokenDto {
  @ApiProperty()
  @IsString()
  contractHash: string;
  @ApiProperty()
  @IsString()
  symbol: string;
  @ApiProperty()
  @IsString()
  publicKey: string;
  @ApiProperty()
  @IsNumber()
  timestamp: number;
}
