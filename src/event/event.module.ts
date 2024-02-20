import { Module } from "@nestjs/common";
import { EventService } from "./event.service";
import { CommonModule } from "../common/common.module";
import { ContractModule } from "../contract/contract.module";

@Module({
  imports: [CommonModule, ContractModule],
  providers: [EventService],
})
export class EventModule {}
