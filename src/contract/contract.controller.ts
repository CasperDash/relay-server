import { Controller, Get, Param } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Transaction } from "./schemas/transaction.schema";

@Controller("contract")
@ApiTags("Contract")
export class ContractController {
  constructor(private transactionService: TransactionService) {}
  @ApiOperation({ summary: "Get transactions of a registered contract" })
  @ApiOkResponse({
    type: Transaction,
    isArray: true,
  })
  @Get(":contractHash/transaction")
  @ApiParam({
    name: "contractHash",
    example: "856848e71814a44a4c5edf1f4f1b870617f81a0893335fd2fbd0287fed227810",
  })
  getTransactions(@Param("contractHash") contractHash: string) {
    return this.transactionService.getByContractHash(contractHash);
  }
}
