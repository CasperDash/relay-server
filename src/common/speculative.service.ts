import { Injectable } from "@nestjs/common";
import { RpcService } from "./rpc.service";
import { CasperServiceByJsonRPC, DeployUtil } from "casper-js-sdk";

@Injectable()
export class SpeculativeService {
  private nodeClient: CasperServiceByJsonRPC;
  constructor(private rpcService: RpcService) {
    this.nodeClient = new CasperServiceByJsonRPC(
      this.rpcService.getSpeculativeRpcUrl(),
    );
  }

  async refresh() {
    this.nodeClient = new CasperServiceByJsonRPC(
      await this.rpcService.refreshSpeculativeRpcUrl(),
    );
  }

  async speculativeDeploy(deploy: DeployUtil.Deploy) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.nodeClient.speculativeDeploy(deploy);
  }
}
