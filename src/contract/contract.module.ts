import { Module } from "@nestjs/common";
import { ContractService } from "./contract.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Contract, ContractSchema } from "./schemas/contract.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
    ]),
  ],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
