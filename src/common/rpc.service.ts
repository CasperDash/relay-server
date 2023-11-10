import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class RpcService {
  private logger = new Logger("RpcService");
  private rpcUrl: string;
  private speculativeRpcUrl: string;
  private eventStreamUrl: string;

  constructor(private configService: ConfigService) {
    const RPC_URLS = this.configService.get<string[]>("RPC_URLS");
    if (!RPC_URLS.length) {
      throw new Error(`No active RPC server found`);
    }
    this.rpcUrl = RPC_URLS[0];

    const SPEC_RPC_URLS = this.configService.get<string[]>("SPEC_RPC_URLS");
    if (!SPEC_RPC_URLS.length) {
      throw new Error(`No active speculative RPC server found`);
    }
    this.speculativeRpcUrl = SPEC_RPC_URLS[0];
  }

  getRpcUrl() {
    return this.rpcUrl;
  }

  getSpeculativeRpcUrl() {
    return this.speculativeRpcUrl;
  }

  async refreshRpcUrl() {
    const RPC_URLS = this.configService.get<string[]>(`RPC_URLS`);
    for (const rpcUrl of RPC_URLS) {
      try {
        await axios.get(rpcUrl, {
          timeout: Number(this.configService.get<number>(`RPC_TIMEOUT`)),
          validateStatus: (status) => status < 500,
        });
        this.logger.log(`Set rpc url to ${rpcUrl}`);
        this.rpcUrl = rpcUrl;
        return this.rpcUrl;
      } catch (error) {
        this.logger.error(`${rpcUrl} is unreachable`);
      }
    }
    throw new Error(`No active rpc url found`);
  }

  async refreshSpeculativeRpcUrl() {
    const SPEC_RPC_URLS = this.configService.get<string[]>(`SPEC_RPC_URLS`);
    for (const speculativeRpcUrl of SPEC_RPC_URLS) {
      try {
        await axios.get(speculativeRpcUrl, {
          timeout: Number(this.configService.get<number>(`RPC_TIMEOUT`)),
          validateStatus: (status) => status < 500,
        });
        this.logger.log(`Set rpc url to ${speculativeRpcUrl}`);
        this.speculativeRpcUrl = speculativeRpcUrl;
        return this.rpcUrl;
      } catch (error) {
        this.logger.error(`${speculativeRpcUrl} is unreachable`);
      }
    }
    throw new Error(`No active speculative rpc url found`);
  }

  async refreshEventStreamUrl() {
    const EVENT_STREAM_URLS =
      this.configService.get<string[]>(`EVENT_STREAM_URLS`);
    for (const eventStreamUrl of EVENT_STREAM_URLS) {
      try {
        await axios.get(eventStreamUrl, {
          timeout: Number(this.configService.get<number>(`RPC_TIMEOUT`)),
          responseType: "stream",
        });
        this.logger.log(`Set event stream url to ${eventStreamUrl}`);
        this.eventStreamUrl = eventStreamUrl;
        return this.eventStreamUrl;
      } catch (error) {
        this.logger.error(`${eventStreamUrl} is unreachable`);
      }
    }
    throw new Error(`No active event stream found`);
  }
}
