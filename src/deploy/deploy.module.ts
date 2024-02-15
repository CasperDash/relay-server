import { Module } from "@nestjs/common";
import { DeployController } from "./deploy.controller";
import { DeployService } from "./deploy.service";
import { CommonModule } from "../common/common.module";
import { UserModule } from "../user/user.module";
import { ContractModule } from "../contract/contract.module";

@Module({
  imports: [CommonModule, UserModule, ContractModule],
  controllers: [DeployController],
  providers: [DeployService],
})
export class DeployModule {}
