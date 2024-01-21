import { Injectable } from "@nestjs/common";
import { CLPublicKey, Contracts } from "casper-js-sdk";
import { ConfigService } from "@nestjs/config";
import { CasperService } from "../common/casper.service";
import { BigNumber } from "@ethersproject/bignumber";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Contract } from "./schemas/contract.schema";

@Injectable()
export class UserService {
  private relayContractClient: Contracts.Contract;

  constructor(
    private configService: ConfigService,
    private casperService: CasperService,
    @InjectModel(Contract.name) private contractModel: Model<Contract>,
  ) {
    this.relayContractClient = new Contracts.Contract(
      this.casperService.getCasperClient(),
    );
    this.relayContractClient.setContractHash(
      `hash-${this.configService.get<string>("RELAY_CONTRACT_HASH")}`,
    );
  }

  async getBalance(publicKey: string) {
    const accountHash = CLPublicKey.fromHex(publicKey)
      .toAccountRawHashStr()
      .toLowerCase();
    const balance = await this.relayContractClient.queryContractDictionary(
      "owner_balance",
      accountHash,
    );

    return balance.value() as BigNumber;
  }

  async createTransaction(
    transactionType: string,
    accountHash: string,
    amount: string,
  ) {
    return this.contractModel.create({
      transactionType,
      accountHash,
      amount,
    });
  }
}
