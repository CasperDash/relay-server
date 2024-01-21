import { Module } from "@nestjs/common";
import { EventService } from "./event.service";
import { CommonModule } from "../common/common.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [CommonModule, UserModule],
  providers: [EventService],
})
export class EventModule {}
