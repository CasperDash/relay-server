import { Controller, Get, Param, Query } from "@nestjs/common";
import { UserService } from "./user.service";
import { CLPublicKey } from "casper-js-sdk";

@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}

  @Get(":publicKey/balance")
  async getBalance(
    @Param("publicKey") publicKey: string,
    @Query("cep18") cep18Symbol?: string,
  ) {
    const accountHash = CLPublicKey.fromHex(publicKey).toAccountRawHashStr();
    const balance = await this.userService.getBalance(accountHash, cep18Symbol);
    return { balance: balance.toString() };
  }
}
