import { Injectable, NotFoundException } from "@nestjs/common";
import { Contracts } from "casper-js-sdk";
import { ConfigService } from "@nestjs/config";
import { CasperService } from "../common/casper.service";
import { BigNumber } from "@ethersproject/bignumber";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Transaction } from "./schemas/transaction.schema";
import { bytesToHex } from "@noble/hashes/utils";

@Injectable()
export class UserService {
  private relayContractClient: Contracts.Contract;

  constructor(
    private configService: ConfigService,
    private casperService: CasperService,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {
    this.relayContractClient = new Contracts.Contract(
      this.casperService.getCasperClient(),
    );
    this.relayContractClient.setContractHash(
      `hash-${this.configService.get<string>("RELAY_CONTRACT_HASH")}`,
    );
  }

  async getBalance(accountHash: string) {
    const balance = await this.relayContractClient.queryContractDictionary(
      "owner_balance",
      accountHash,
    );

    return balance.value() as BigNumber;
  }

  async getContractOwner(contractHash: string) {
    try {
      const owner = await this.relayContractClient.queryContractDictionary(
        "registered_contract",
        contractHash,
      );
      return bytesToHex(owner.value());
    } catch (e) {
      throw new NotFoundException(`Contract ${contractHash} is unregistered`);
    }
  }

  async createTransaction(
    deployHash: string,
    transactionType: string,
    accountHash: string,
    amount: string,
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
      contractHash,
      entryPoint,
    });
  }
}
