import { Controller, Get, Param, Query } from "@nestjs/common";
import { UserService } from "./user.service";
import { CLPublicKey } from "casper-js-sdk";
import { ContractService } from "../contract/contract.service";
import { PublicKeyValidationPipe } from "./pipes/public-key-validation.pipe";
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Contract } from "../contract/schemas/contract.schema";

@ApiTags("User")
@Controller("user")
export class UserController {
  constructor(
    private userService: UserService,
    private contractService: ContractService,
  ) {}

  @Get(":publicKey/balance")
  @ApiOperation({ summary: "Get remaining balance of a contract owner" })
  @ApiParam({
    name: "publicKey",
    example:
      "01c1003f6a4f7d7d2b8a4185e2a69cdf799d57014565d37f7322ff9ad183472a19",
  })
  @ApiQuery({
    name: "cep18",
    required: false,
    description: "CEP-18 token name, leave blank for CSPR",
    example: "USDT",
  })
  async getBalance(
    @Param("publicKey", PublicKeyValidationPipe) publicKey: string,
    @Query("cep18") cep18Symbol?: string,
  ) {
    const accountHash = CLPublicKey.fromHex(publicKey).toAccountRawHashStr();
    const balance = await this.userService.getBalance(accountHash, cep18Symbol);
    return { balance: balance.toString() };
  }
  @Get(":publicKey/contract")
  @ApiOperation({ summary: "Get registered contracts of a contract owner" })
  @ApiParam({
    name: "publicKey",
    example:
      "01c1003f6a4f7d7d2b8a4185e2a69cdf799d57014565d37f7322ff9ad183472a19",
  })
  @ApiOkResponse({
    type: Contract,
    isArray: true,
  })
  async getContracts(
    @Param("publicKey", PublicKeyValidationPipe) publicKey: string,
  ) {
    const accountHash = CLPublicKey.fromHex(publicKey).toAccountRawHashStr();
    return await this.contractService.getContracts(accountHash);
  }
}
