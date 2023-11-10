import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CommonModule } from "./common/common.module";
import { ConfigModule } from "@nestjs/config";
import { DeployModule } from "./deploy/deploy.module";
import RpcConfig from "./config/rpc-config";

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [RpcConfig],
    }),
    DeployModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
