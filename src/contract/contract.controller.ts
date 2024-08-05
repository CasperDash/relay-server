import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Transaction } from "./schemas/transaction.schema";
import { Contract } from "./schemas/contract.schema";
import { ContractService } from "./contract.service";
import { RegisterDto } from "./dtos/register.dto";
import { Pair } from "./schemas/pair.schema";
import { PairService } from "./pair.service";
import { UpdatePaymentTokenDto } from "./dtos/update-payment-token.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("contract")
@ApiTags("Contract")
export class ContractController {
  constructor(
    private transactionService: TransactionService,
    private contractService: ContractService,
    private pairService: PairService,
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

  @Get("payment-token")
  @ApiOperation({ summary: "Get supported payment tokens" })
  @ApiOkResponse({
    type: Pair,
    isArray: true,
  })
  getPairs() {
    return this.pairService.get();
  }

  @Patch("payment-token")
  @ApiOperation({ summary: "Update payment token of a contract" })
  @ApiHeader({
    name: "x-signature",
    description: "Signature of request body",
  })
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: Contract,
  })
  updatePaymentToken(@Body() updatePaymentTokenDto: UpdatePaymentTokenDto) {
    return this.contractService.updatePaymentToken(
      updatePaymentTokenDto.contractHash,
      updatePaymentTokenDto.symbol,
      updatePaymentTokenDto.publicKey,
    );
  }
}
