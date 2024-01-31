import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import {
  CasperClient,
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
    @InjectModel(Pair.name) private pairModel: Model<Pair>,
  ) {}

  async deploy(
    originalDeploy: DeployUtil.Deploy,
    transferDeploy?: DeployUtil.Deploy,
  ) {
    const contractHash = bytesToHex(
      originalDeploy.session.storedContractByHash.hash,
    );
    const owner = await this.userService.getContractOwner(contractHash);
    // Make deploy
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
    const cost = await this.estimateGasCost(originalDeploy, payAmount);
    const ownerBalance = await this.userService.getBalance(owner);
    if (ownerBalance.lt(cost)) {
      throw new NotAcceptableException("Insufficient balance");
    }
    const signedDeploy = DeployUtil.signDeploy(
      DeployUtil.makeDeploy(
        deployParam,
        this.buildDeployItem(originalDeploy, cost, payAmount),
        DeployUtil.standardPayment(cost),
      ),
      paymasterKey,
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
    cep18?: string,
  ) {
    const payAmount = BigNumber.from(
      transferDeploy?.session.asTransfer()?.getArgByName("amount")?.value() ??
        0,
    );
    const cost = await this.estimateGasCost(originalDeploy, payAmount);
    if (cep18) {
      return this.exchangeToCep18(cost, cep18);
    }
    return cost;
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

  private buildDeployItem(
    originalDeploy: DeployUtil.Deploy,
    gasAmount: BigNumberish,
    payAmount: BigNumberish = BigNumber.from(0),
  ) {
    return DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      Contracts.contractHashToByteArray(
        this.configService.get<string>(`RELAY_CONTRACT_HASH`),
      ),
      "call_on_behalf",
      RuntimeArgs.fromMap({
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
      }),
    );
  }

  private async estimateGasCost(
    originalDeploy: DeployUtil.Deploy,
    payAmount: BigNumberish,
  ) {
    // Make deploy
    const paymasterKey = Keys.Ed25519.loadKeyPairFromPrivateFile(
      this.configService.get<string>(`PAYMASTER_KEY_PATH`),
    );
    const deployParam = new DeployUtil.DeployParams(
      paymasterKey.publicKey,
      this.configService.get<string>(`CHAIN_NAME`),
    );
    const estimate: SpeculativeDeployResult =
      await this.speculativeService.speculativeDeploy(
        DeployUtil.signDeploy(
          DeployUtil.makeDeploy(
            deployParam,
            this.buildDeployItem(originalDeploy, 0, payAmount),
            DeployUtil.standardPayment(100 * MOTE_RATE),
          ),
          paymasterKey,
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

  private async exchangeToCep18(csprAmount: BigNumberish, cep18: string) {
    const pairContractClient = new Contracts.Contract(
      // TODO: use casperService.getCasperClient(),
      new CasperClient(`http://testnet-node.melem.io:7777/rpc`),
    );
    const pair = await this.pairModel.findOne({
      name: cep18.toUpperCase(),
    });
    if (!pair) {
      throw new NotFoundException(`${cep18.toUpperCase()} is not supported`);
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
}
