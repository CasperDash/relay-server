import { Injectable } from "@nestjs/common";
import { CLPublicKey, Contracts } from "casper-js-sdk";
import { ConfigService } from "@nestjs/config";
import { CasperService } from "../common/casper.service";
import { BigNumber } from "@ethersproject/bignumber";

@Injectable()
export class UserService {
  private relayContractClient: Contracts.Contract;

  constructor(
    private configService: ConfigService,
    private casperService: CasperService,
  ) {
    this.relayContractClient = new Contracts.Contract(
      this.casperService.casperClient,
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
}
