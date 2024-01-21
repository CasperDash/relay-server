import { Module } from "@nestjs/common";
import { DeployController } from "./deploy.controller";
import { DeployService } from "./deploy.service";
import { CommonModule } from "../common/common.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [CommonModule, UserModule],
  controllers: [DeployController],
  providers: [DeployService],
})
export class DeployModule {}
