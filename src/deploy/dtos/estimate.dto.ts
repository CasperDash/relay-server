import { IsDeploy } from "../decorators/is-deploy.decorator";
import { IsOptional } from "class-validator";

export class EstimateDto {
  @IsDeploy()
  deploy: object;

  @IsOptional()
  @IsDeploy({ isTransfer: true })
  transferDeploy?: object;

  @IsOptional()
  cep18: string;
}
