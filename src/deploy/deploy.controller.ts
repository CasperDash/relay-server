import { Body, Controller, Post } from "@nestjs/common";
import { DeployService } from "./deploy.service";
import { DeployUtil } from "casper-js-sdk";
import { DeployDto } from "./dtos/deloy.dto";

@Controller("deploy")
export class DeployController {
  constructor(private deployService: DeployService) {}

  @Post("/")
  deploy(@Body() deployDto: DeployDto) {
    const deploy = DeployUtil.deployFromJson(deployDto.deploy).unwrap();
    const transferDeploy = deployDto.transferDeploy
      ? DeployUtil.deployFromJson(deployDto.transferDeploy).unwrap()
      : null;

    return this.deployService.deploy(deploy, transferDeploy);
  }
}
