import { Module } from "@nestjs/common";
import { ContractService } from "./contract.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Contract, ContractSchema } from "./schemas/contract.schema";
import { PairService } from "./pair.service";
import { Pair, PairSchema } from "./schemas/pair.schema";
import { ContractController } from "./contract.controller";
import { Transaction, TransactionSchema } from "./schemas/transaction.schema";
import { TransactionService } from "./transaction.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Pair.name, schema: PairSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [ContractService, PairService, TransactionService],
  exports: [ContractService, PairService, TransactionService],
  controllers: [ContractController],
})
export class ContractModule {}
