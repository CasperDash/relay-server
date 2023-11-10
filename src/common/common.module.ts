import { Module } from "@nestjs/common";
import { RpcService } from "./rpc.service";
import { CasperService } from "./casper.service";
import { SpeculativeService } from "./speculative.service";

@Module({
  providers: [RpcService, CasperService, SpeculativeService],
  exports: [SpeculativeService, CasperService, RpcService],
})
export class CommonModule {}
