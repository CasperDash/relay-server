import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Contract } from "./schemas/contract.schema";
import { CasperService } from "../common/casper.service";
import {
  CLPublicKey,
  CLValueBuilder,
  Contracts,
  Keys,
  RuntimeArgs,
} from "casper-js-sdk";
import { ConfigService } from "@nestjs/config";
import { bytesToHex } from "@noble/hashes/utils";
import { PairService } from "./pair.service";
import { PairDocument } from "./schemas/pair.schema";

@Injectable()
export class ContractService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<Contract>,
    private casperService: CasperService,
    private configService: ConfigService,
    private pairService: PairService,
  ) {}

  async createOrUpdateContract(ownerAccountHash: string, contractHash: string) {
    return this.contractModel.updateOne(
      {
        contractHash,
      },
      {
        ownerAccountHash,
      },
      {
        upsert: true,
      },
    );
  }

  async getContracts(accountHash: string) {
    return this.contractModel
      .find({ ownerAccountHash: accountHash })
      .populate("paymentToken");
  }

  async getContractByHash(contractHash: string) {
    const contract = await this.contractModel
      .findOne({ contractHash })
      .populate("paymentToken")
      .exec();

    if (!contract) {
      throw new BadRequestException("Contract is not registered");
    }
    return contract;
  }

  async register(contractHash: string) {
    const targetContractClient = new Contracts.Contract(
      this.casperService.getCasperClient(),
    );
    targetContractClient.setContractHash(`hash-${contractHash}`);
    let relayContractPackage: Uint8Array;
    let installer: Uint8Array;
    try {
      relayContractPackage = await targetContractClient.queryContractData([
        "relay_contract_package",
      ]);
      installer = await targetContractClient.queryContractData(["installer"]);
    } catch (e) {
      throw new BadRequestException("Contract is incompatible");
    }
    if (
      bytesToHex(relayContractPackage) !==
      this.configService.get("RELAY_CONTRACT_PACKAGE_HASH")
    ) {
      throw new BadRequestException("Contract is incompatible");
    }
    // Call register entrypoint
    const paymasterKey = Keys.Ed25519.loadKeyPairFromPrivateFile(
      this.configService.get<string>(`PAYMASTER_KEY_PATH`),
    );
    const relayContractClient = new Contracts.Contract(
      this.casperService.getCasperClient(),
    );
    relayContractClient.setContractHash(
      `hash-${this.configService.get("RELAY_CONTRACT_HASH")}`,
    );
    const registerDeploy = relayContractClient.callEntrypoint(
      "register",
      RuntimeArgs.fromMap({
        contract: CLValueBuilder.byteArray(
          Contracts.contractHashToByteArray(contractHash),
        ),
        owner: CLValueBuilder.byteArray(installer),
      }),
      paymasterKey.publicKey,
      this.configService.get<string>(`CHAIN_NAME`),
      String(1_000_000_000),
      [paymasterKey],
    );

    return this.casperService.tryDeploy(registerDeploy);
  }

  async updatePaymentToken(
    contractHash: string,
    symbol: string,
    publicKey: string,
  ) {
    let paymentToken: PairDocument = null;
    if (symbol.toUpperCase() !== "CSPR") {
      paymentToken = await this.pairService.getBySymbol(symbol);
    }
    const contract = await this.getContractByHash(contractHash);

    if (
      contract.ownerAccountHash !==
      CLPublicKey.fromHex(publicKey).toAccountRawHashStr()
    ) {
      throw new UnauthorizedException("Unauthorized");
    }

    return this.contractModel.findOneAndUpdate(
      { contractHash },
      {
        paymentToken,
      },
    );
  }
}
