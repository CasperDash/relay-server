import { Module } from "@nestjs/common";
import { DeployController } from "./deploy.controller";
import { DeployService } from "./deploy.service";
import { CommonModule } from "../common/common.module";
import { UserModule } from "../user/user.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Pair, PairSchema } from "./schemas/pair.schema";
import { ContractModule } from "../contract/contract.module";

@Module({
  imports: [
    CommonModule,
    UserModule,
    ContractModule,
    MongooseModule.forFeature([{ name: Pair.name, schema: PairSchema }]),
  ],
  controllers: [DeployController],
  providers: [DeployService],
})
export class DeployModule {}
