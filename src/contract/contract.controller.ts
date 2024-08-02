import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Transaction } from "./schemas/transaction.schema";
import { Contract } from "./schemas/contract.schema";
import { ContractService } from "./contract.service";
import { RegisterDto } from "./dtos/register.dto";

@Controller("contract")
@ApiTags("Contract")
export class ContractController {
  constructor(
    private transactionService: TransactionService,
    private contractService: ContractService,
  ) {}
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

  @Post("register")
  @ApiOperation({ summary: "Register a new contract" })
  @ApiCreatedResponse({
    type: Contract,
  })
  async registerContract(@Body() registerDto: RegisterDto) {
    const deployHash = await this.contractService.register(
      registerDto.contractHash,
    );

    return { deployHash };
  }
}
