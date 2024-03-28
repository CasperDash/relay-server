import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { CommonModule } from "../common/common.module";
import { ContractModule } from "../contract/contract.module";

@Module({
  imports: [CommonModule, ContractModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
