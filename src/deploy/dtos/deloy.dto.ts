import { IsDeploy } from "../decorators/is-deploy.decorator";
import { IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DeployDto {
  @ApiProperty()
  @IsDeploy()
  deploy: object;

  @IsOptional()
  @ApiPropertyOptional()
  @IsDeploy({ isTransfer: true })
  transferDeploy?: object;
}
