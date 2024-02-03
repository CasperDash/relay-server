import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { CommonModule } from "../common/common.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Transaction, TransactionSchema } from "./schemas/transaction.schema";

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
