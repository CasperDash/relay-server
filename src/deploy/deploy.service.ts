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
import { BigNumber } from "@ethersproject/bignumber";
import { bytesToHex } from "@noble/hashes/utils";

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
    let payAmount = BigNumber.from(0);
    if (transferDeploy) {
      payAmount = BigNumber.from(
        transferDeploy.session.asTransfer()?.getArgByName("amount")?.value(),
      );
    }
    // Make deploy
    const paymasterKey = Keys.Ed25519.loadKeyPairFromPrivateFile(
      this.configService.get<string>(`PAYMASTER_KEY_PATH`),
    );
    const deployParam = new DeployUtil.DeployParams(
      paymasterKey.publicKey,
      this.configService.get<string>(`CHAIN_NAME`),
    );
    const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      Contracts.contractHashToByteArray(
        this.configService.get<string>(`RELAY_CONTRACT_HASH`),
      ),
      "call_entry_point",
      RuntimeArgs.fromMap({
        contract: CLValueBuilder.byteArray(
          originalDeploy.session.storedContractByHash.hash,
        ),
        caller: originalDeploy.header.account,
        entry_point: CLValueBuilder.string(
          originalDeploy.session.storedContractByHash.entryPoint,
        ),
        pay_amount: CLValueBuilder.u512(payAmount),
        args: CLValueBuilder.byteArray(
          originalDeploy.session.storedContractByHash.args.toBytes().unwrap(),
        ),
      }),
    );
    const estimate: SpeculativeDeployResult =
      await this.speculativeService.speculativeDeploy(
        DeployUtil.signDeploy(
          DeployUtil.makeDeploy(
            deployParam,
            session,
            DeployUtil.standardPayment(100 * 1_000_000_000),
          ),
          paymasterKey,
        ),
      );
    if (estimate.execution_result.Failure) {
      throw new NotAcceptableException(
        estimate.execution_result.Failure.error_message,
      );
    }
    const cost = estimate.execution_result.Success.cost;
    const signedDeploy = DeployUtil.signDeploy(
      DeployUtil.makeDeploy(
        deployParam,
        session,
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
}
