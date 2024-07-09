import { IsDeploy } from "../decorators/is-deploy.decorator";
import { IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";

export class EstimateDto {
  @ApiProperty()
  @IsDeploy()
  deploy: object;

  @IsOptional()
  @ApiPropertyOptional()
  @IsDeploy({ isTransfer: true })
  transferDeploy?: object;

  @IsOptional()
  @ApiPropertyOptional()
  cep18: string;
}
