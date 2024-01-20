import { Controller, Get, Param } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}

  @Get(":publicKey/balance")
  async getBalance(@Param("publicKey") publicKey: string) {
    const balance = await this.userService.getBalance(publicKey);
    return { balance: balance.toString() };
  }
}
