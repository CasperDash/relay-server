import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import {
  CLValueBuilder,
  Contracts,
  DeployUtil,
  Keys,
  RuntimeArgs,
} from "casper-js-sdk";
import { ConfigService } from "@nestjs/config";
import { RpcService } from "../common/rpc.service";
import { SpeculativeService } from "../common/speculative.service";
import { CasperService } from "../common/casper.service";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { bytesToHex } from "@noble/hashes/utils";
import { UserService } from "../user/user.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Pair } from "./schemas/pair.schema";
import { ContractService } from "../contract/contract.service";

const MOTE_RATE = 1_000_000_000;

type SpeculativeDeployResult = {
  execution_result: {
    Success?: {
      cost: number;
    };
    Failure?: any;
  };
};

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(
    private configService: ConfigService,
    private rpcService: RpcService,
    private casperService: CasperService,
    private speculativeService: SpeculativeService,
    private userService: UserService,
    private contractService: ContractService,
    @InjectModel(Pair.name) private pairModel: Model<Pair>,
  ) {}

  async deploy(
    originalDeploy: DeployUtil.Deploy,
    transferDeploy?: DeployUtil.Deploy,
  ) {
    const contractHash = bytesToHex(
      originalDeploy.session.storedContractByHash.hash,
    );
    const contract = await this.contractService.getContractByHash(contractHash);
    if (!contract) {
      throw new NotFoundException("Contract is not registered");
    }
    let cost: BigNumber;
    let gasAmount: BigNumber;
    if (!contract.paymentToken) {
      // Pay with CSPR
      cost = await this.estimateGasCost(originalDeploy, transferDeploy);
      gasAmount = cost;
      const ownerBalance = await this.userService.getBalance(
        contract.ownerAccountHash,
      );
      if (ownerBalance.lt(cost)) {
        throw new NotAcceptableException("Insufficient balance");
      }
    } else {
      // Pay with CEP18
      cost = await this.estimateGasCost(
        originalDeploy,
        transferDeploy,
        contract.paymentToken.tokenContract,
      );
      gasAmount = await this.exchangeToCep18(
        cost,
        contract.paymentToken.tokenContract,
      );
    }
    const signedDeploy = this.makeRelayDeploy(
      originalDeploy,
      cost,
      transferDeploy,
      gasAmount,
      contract?.paymentToken?.tokenContract,
    );
    if (transferDeploy) {
      this.transfer(transferDeploy).then((transferDeployHash) => {
        this.logger.log(
          `Transfer deploy hash ${transferDeployHash} is confirmed`,
        );
        signedDeploy
          .send(this.rpcService.getRpcUrl())
          .then((deployHash) =>
            this.logger.log(`Deploy hash ${deployHash} is confirmed`),
          );
      });
    } else {
      signedDeploy
        .send(this.rpcService.getRpcUrl())
        .then((deployHash) =>
          this.logger.log(`Deploy hash ${deployHash} is confirmed`),
        );
    }

    return {
      deployHash: bytesToHex(signedDeploy.hash),
      transferDeployHash: transferDeploy
        ? bytesToHex(transferDeploy.hash)
        : undefined,
    };
  }

  async estimate(
    originalDeploy: DeployUtil.Deploy,
    transferDeploy?: DeployUtil.Deploy,
    cep18Symbol?: string,
  ) {
    if (!cep18Symbol) {
      return this.estimateGasCost(originalDeploy, transferDeploy);
    }
    const pair = await this.pairModel.findOne({ symbol: cep18Symbol });
    if (!pair) {
      throw new NotFoundException(`Token ${cep18Symbol} is not supported`);
    }
    const cost = await this.estimateGasCost(
      originalDeploy,
      transferDeploy,
      pair.tokenContract,
    );
    return this.exchangeToCep18(cost, pair.tokenContract);
  }

  private async transfer(deploy: DeployUtil.Deploy) {
    // Check transfer target
    const target = deploy.session
      .asTransfer()
      ?.getArgByName("target")
      ?.toJSON();

    if (target !== this.configService.get<string>(`RELAY_PURSE`)) {
      throw new BadRequestException("Invalid transfer target");
    }
    const deployHash = await deploy.send(this.rpcService.getRpcUrl());
    const isTransferSuccess =
      await this.casperService.waitForDeploy(deployHash);

    if (!isTransferSuccess) {
      throw new NotAcceptableException("Transfer failed");
    }

    return deployHash;
  }

  private async estimateGasCost(
    originalDeploy: DeployUtil.Deploy,
    transferDeploy?: DeployUtil.Deploy,
    cep18TokenHash?: string,
  ) {
    const estimate: SpeculativeDeployResult =
      await this.speculativeService.speculativeDeploy(
        this.makeRelayDeploy(
          originalDeploy,
          100 * MOTE_RATE, // Make dummy deploy to estimate gas cost
          transferDeploy,
          MOTE_RATE,
          cep18TokenHash,
        ),
      );
    if (estimate.execution_result.Failure) {
      throw new NotAcceptableException(
        estimate.execution_result.Failure.error_message,
      );
    }
    return BigNumber.from(estimate.execution_result.Success.cost)
      .mul(100 + Number(this.configService.get("GAS_BUFFER")))
      .div(100);
  }

  private async exchangeToCep18(
    csprAmount: BigNumberish,
    tokenContract: string,
  ) {
    const pairContractClient = new Contracts.Contract(
      this.casperService.getCasperClient(),
    );
    const pair = await this.pairModel.findOne({
      tokenContract,
    });
    if (!pair) {
      throw new NotFoundException(`Token ${tokenContract} is not supported`);
    }
    pairContractClient.setContractHash(`hash-${pair.pairContract}`);
    const reserveWcspr: BigNumber = await pairContractClient.queryContractData([
      "reserve0",
    ]);
    const reserveCep18: BigNumber = await pairContractClient.queryContractData([
      "reserve1",
    ]);
    const numerator = reserveCep18.mul(csprAmount).mul(1000);
    const denominator = reserveWcspr.sub(csprAmount).mul(997);
    return numerator.div(denominator).add(1);
  }

  private makeRelayDeploy(
    originalDeploy: DeployUtil.Deploy,
    cost: BigNumberish,
    transferDeploy?: DeployUtil.Deploy,
    gasAmount: BigNumberish = 0,
    cep18TokenHash?: string,
  ) {
    const paymasterKey = Keys.Ed25519.loadKeyPairFromPrivateFile(
      this.configService.get<string>(`PAYMASTER_KEY_PATH`),
    );
    const deployParam = new DeployUtil.DeployParams(
      paymasterKey.publicKey,
      this.configService.get<string>(`CHAIN_NAME`),
    );
    const payAmount = BigNumber.from(
      transferDeploy?.session.asTransfer()?.getArgByName("amount")?.value() ??
        0,
    );
    const args = {
      contract: CLValueBuilder.byteArray(
        originalDeploy.session.storedContractByHash.hash,
      ),
      caller: CLValueBuilder.byteArray(
        originalDeploy.header.account.toAccountHash(),
      ),
      entry_point: CLValueBuilder.string(
        originalDeploy.session.storedContractByHash.entryPoint,
      ),
      pay_amount: CLValueBuilder.u512(payAmount),
      gas_amount: CLValueBuilder.u512(gasAmount),
      args: CLValueBuilder.byteArray(
        originalDeploy.session.storedContractByHash.args.toBytes().unwrap(),
      ),
    };
    if (cep18TokenHash) {
      args["cep18_hash"] = CLValueBuilder.byteArray(
        Contracts.contractHashToByteArray(cep18TokenHash),
      );
    }
    const sessionDeployItem =
      DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        Contracts.contractHashToByteArray(
          this.configService.get<string>(`RELAY_CONTRACT_HASH`),
        ),
        "call_on_behalf",
        RuntimeArgs.fromMap(args),
      );

    return DeployUtil.signDeploy(
      DeployUtil.makeDeploy(
        deployParam,
        sessionDeployItem,
        DeployUtil.standardPayment(cost),
      ),
      paymasterKey,
    );
  }
}
