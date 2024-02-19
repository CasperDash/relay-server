import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Transaction } from "./schemas/transaction.schema";

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  async create(
    deployHash: string,
    transactionType: string,
    accountHash: string,
    amount: string,
    cep18Hash?: string,
    contractHash?: string,
    entryPoint?: string,
  ) {
    const transaction = await this.transactionModel.findOne({ deployHash });
    if (transaction) {
      return transaction;
    }
    return this.transactionModel.create({
      deployHash,
      transactionType,
      accountHash,
      amount,
      cep18Hash,
      contractHash,
      entryPoint,
    });
  }

  async getByContractHash(contractHash: string) {
    return this.transactionModel.find({ contractHash });
  }
}
