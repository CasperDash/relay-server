import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
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
  ) {}

  async deploy(
    originalDeploy: DeployUtil.Deploy,
    transferDeploy?: DeployUtil.Deploy,
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
            this.buildDeployItem(originalDeploy, 0, transferDeploy),
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
    const cost = BigNumber.from(estimate.execution_result.Success.cost)
      .mul(100 + Number(this.configService.get("GAS_BUFFER")))
      .div(100);
    const signedDeploy = DeployUtil.signDeploy(
      DeployUtil.makeDeploy(
        deployParam,
        this.buildDeployItem(originalDeploy, cost, transferDeploy),
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
    transferDeploy?: DeployUtil.Deploy,
  ) {
    let payAmount = BigNumber.from(0);
    if (transferDeploy) {
      payAmount = BigNumber.from(
        transferDeploy.session.asTransfer()?.getArgByName("amount")?.value(),
      );
    }

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
}
