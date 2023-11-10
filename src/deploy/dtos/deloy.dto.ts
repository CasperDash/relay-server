import { IsDeploy } from "../decorators/is-deploy.decorator";
import { IsOptional } from "class-validator";

export class DeployDto {
  @IsDeploy()
  deploy: object;

  @IsOptional()
  @IsDeploy({ isTransfer: true })
  transferDeploy?: object;
}
