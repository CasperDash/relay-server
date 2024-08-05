import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CommonModule } from "./common/common.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DeployModule } from "./deploy/deploy.module";
import { UserModule } from "./user/user.module";
import { EventModule } from "./event/event.module";
import RpcConfig from "./config/rpc-config";
import { MongooseModule } from "@nestjs/mongoose";
import { ContractModule } from "./contract/contract.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [RpcConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>("MONGODB_URI"),
      }),
    }),
    DeployModule,
    UserModule,
    EventModule,
    ContractModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
