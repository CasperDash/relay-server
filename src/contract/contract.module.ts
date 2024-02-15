import { Module } from "@nestjs/common";
import { ContractService } from "./contract.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Contract, ContractSchema } from "./schemas/contract.schema";
import { PairService } from "./pair.service";
import { Pair, PairSchema } from "./schemas/pair.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Pair.name, schema: PairSchema },
    ]),
  ],
  providers: [ContractService, PairService],
  exports: [ContractService, PairService],
})
export class ContractModule {}
