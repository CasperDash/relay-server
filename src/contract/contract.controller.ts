import { Controller, Get, Param } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { ApiTags } from "@nestjs/swagger";

@Controller("contract")
@ApiTags("Contract")
export class ContractController {
  constructor(private transactionService: TransactionService) {}
  @Get(":contractHash/transaction")
  getTransactions(@Param("contractHash") contractHash: string) {
    return this.transactionService.getByContractHash(contractHash);
  }
}
