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

  async trySpeculativeDeploy(deploy: DeployUtil.Deploy) {
    try {
      return await this.nodeClient.speculativeDeploy(deploy);
    } catch (e) {
      await this.refresh();
      throw e;
    }
  }
}
