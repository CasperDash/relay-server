import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { DeployService } from "./deploy.service";
import { DeployUtil } from "casper-js-sdk";
import { DeployDto } from "./dtos/deloy.dto";
import { EstimateDto } from "./dtos/estimate.dto";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Deploy")
@Controller("deploy")
export class DeployController {
  constructor(private deployService: DeployService) {}

  @Post("/")
  deploy(@Body() deployDto: DeployDto) {
    const deploy = DeployUtil.deployFromJson(deployDto.deploy).unwrap();
    const transferDeploy = deployDto.transferDeploy
      ? DeployUtil.deployFromJson(deployDto.transferDeploy).unwrap()
      : undefined;

    return this.deployService.deploy(deploy, transferDeploy);
  }

  @Post("/estimate")
  @HttpCode(200)
  async estimate(@Body() estimateDto: EstimateDto) {
    const deploy = DeployUtil.deployFromJson(estimateDto.deploy).unwrap();
    const transferDeploy = estimateDto.transferDeploy
      ? DeployUtil.deployFromJson(estimateDto.transferDeploy).unwrap()
      : undefined;

    const gasCost = await this.deployService.estimate(
      deploy,
      transferDeploy,
      estimateDto.cep18,
    );
    return { gasCost: gasCost.toString() };
  }
}
