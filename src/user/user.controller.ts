import { Controller, Get, Param, Query } from "@nestjs/common";
import { UserService } from "./user.service";
import { CLPublicKey } from "casper-js-sdk";
import { ContractService } from "../contract/contract.service";

@Controller("user")
export class UserController {
  constructor(
    private userService: UserService,
    private contractService: ContractService,
  ) {}

  @Get(":publicKey/balance")
  async getBalance(
    @Param("publicKey") publicKey: string,
    @Query("cep18") cep18Symbol?: string,
  ) {
    const accountHash = CLPublicKey.fromHex(publicKey).toAccountRawHashStr();
    const balance = await this.userService.getBalance(accountHash, cep18Symbol);
    return { balance: balance.toString() };
  }
  @Get(":publicKey/contract")
  async getContracts(@Param("publicKey") publicKey: string) {
    const accountHash = CLPublicKey.fromHex(publicKey).toAccountRawHashStr();
    return await this.contractService.getContracts(accountHash);
  }
}
