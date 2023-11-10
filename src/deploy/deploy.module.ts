import { Module } from "@nestjs/common";
import { DeployController } from "./deploy.controller";
import { DeployService } from "./deploy.service";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [CommonModule],
  controllers: [DeployController],
  providers: [DeployService],
})
export class DeployModule {}
