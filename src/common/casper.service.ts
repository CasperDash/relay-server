import { Injectable } from "@nestjs/common";
import { RpcService } from "./rpc.service";
import { CasperClient, DeployUtil } from "casper-js-sdk";

@Injectable()
export class CasperService {
  private casperClient: CasperClient;
  constructor(private rpcService: RpcService) {
    this.casperClient = new CasperClient(rpcService.getRpcUrl());
  }

  async refresh() {
    this.casperClient = new CasperClient(await this.rpcService.refreshRpcUrl());
  }

  async waitForDeploy(deployHash: string) {
    const result = await this.casperClient.nodeClient.waitForDeploy(deployHash);
    if (result.execution_results.length === 0) return false;
    return !!result.execution_results[0].result;
  }

  async tryDeploy(deploy: DeployUtil.Deploy) {
    try {
      return await this.casperClient.putDeploy(deploy);
    } catch (e) {
      await this.refresh();
      throw e;
    }
  }

  getCasperClient() {
    return this.casperClient;
  }

  getRpcClient() {
    return this.casperClient.nodeClient;
  }
}
