import { IsDeploy } from "../decorators/is-deploy.decorator";
import { IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DeployDto {
  @ApiProperty({ description: "Signed deploy payload" })
  @IsDeploy()
  deploy: object;

  @IsOptional()
  @ApiPropertyOptional({ description: "Signed transfer deploy payload" })
  @IsDeploy({ isTransfer: true })
  transferDeploy?: object;
}
