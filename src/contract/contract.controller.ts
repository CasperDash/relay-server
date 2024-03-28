import { Controller, Get, Param } from "@nestjs/common";
import { TransactionService } from "./transaction.service";

@Controller("contract")
export class ContractController {
  constructor(private transactionService: TransactionService) {}
  @Get(":contractHash/transaction")
  getTransactions(@Param("contractHash") contractHash: string) {
    return this.transactionService.getByContractHash(contractHash);
  }
}
