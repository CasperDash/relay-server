import { Injectable, NotFoundException } from "@nestjs/common";
import { CLAccountHash, CLByteArray, Contracts } from "casper-js-sdk";
import { ConfigService } from "@nestjs/config";
import { CasperService } from "../common/casper.service";
import { BigNumber } from "@ethersproject/bignumber";
import { PairService } from "../contract/pair.service";
import { CEP18Client } from "casper-cep18-js-client";
import { RpcService } from "../common/rpc.service";
import { hexToBytes } from "@noble/hashes/utils";

@Injectable()
export class UserService {
  private relayContractClient: Contracts.Contract;

  constructor(
    private rpcService: RpcService,
    private configService: ConfigService,
    private casperService: CasperService,
    private pairService: PairService,
  ) {
    this.relayContractClient = new Contracts.Contract(
      this.casperService.getCasperClient(),
    );
    this.relayContractClient.setContractHash(
      `hash-${this.configService.get<string>("RELAY_CONTRACT_HASH")}`,
    );
  }

  async getBalance(accountHash: string, cep18Symbol?: string) {
    if (cep18Symbol) {
      // Get allowance for cep-18 token
      const pair = await this.pairService.getBySymbol(cep18Symbol);
      if (!pair) {
        throw new NotFoundException(`Token ${cep18Symbol} is not supported`);
      }
      const cep18Client = new CEP18Client(
        this.rpcService.getRpcUrl(),
        this.configService.get("CHAIN_NAME"),
      );
      cep18Client.setContractHash(`hash-${pair.tokenContract}`);
      const relayPackageHash = new CLByteArray(
        Contracts.contractHashToByteArray(
          this.configService.get("RELAY_CONTRACT_PACKAGE_HASH"),
        ),
      );
      return await cep18Client.allowances(
        new CLAccountHash(hexToBytes(accountHash)),
        relayPackageHash,
      );
    } else {
      const balance = await this.relayContractClient.queryContractDictionary(
        "owner_balance",
        accountHash,
      );

      return balance.value() as BigNumber;
    }
  }
}
