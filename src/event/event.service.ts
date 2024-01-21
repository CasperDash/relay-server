import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventName, EventStream } from "casper-js-sdk";
import { RpcService } from "../common/rpc.service";
import { Parser } from "@make-software/ces-js-parser";
import { CasperService } from "../common/casper.service";
import { UserService } from "../user/user.service";

const EVENT_NAMES = {
  DEPOSIT: "Deposit",
  REGISTER: "Register",
  CALL_ON_BEHALF: "CallOnBehalf",
} as const;

type RelayEventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

@Injectable()
export class EventService implements OnModuleInit {
  private eventStream: EventStream;
  private cesEventParser: Parser;
  constructor(
    private configService: ConfigService,
    private rpcService: RpcService,
    private casperService: CasperService,
    private userService: UserService,
  ) {
    this.eventStream = new EventStream(this.rpcService.getEventStreamUrl());
  }
  onModuleInit() {
    this.eventStream.start();
    this.eventStream.subscribe(
      EventName.DeployProcessed,
      async (result: any) => {
        const events = await this.parseRelayEvents(result);
        for (const event of events) {
          switch (event.name) {
            case EVENT_NAMES.DEPOSIT:
              const owner = event.data["owner"].value() as string;
              const amount = event.data["amount"].value() as string;
              await this.userService.createTransaction(
                "deposit",
                owner,
                amount,
              );
              break;
            case EVENT_NAMES.REGISTER:
              break;
            case EVENT_NAMES.CALL_ON_BEHALF:
              break;
          }
        }
      },
    );
  }

  async parseRelayEvents(result: any) {
    if (!this.cesEventParser) {
      this.cesEventParser = await Parser.create(
        this.casperService.getRpcClient(),
        [this.configService.get("RELAY_CONTRACT_HASH")],
      );
    }
    const executionResult = result.body.DeployProcessed.execution_result;
    if (!executionResult.Success) {
      return [];
    }

    return this.cesEventParser
      .parseExecutionResult(executionResult)
      .filter(
        (parseResult) =>
          !parseResult.error &&
          Object.values(EVENT_NAMES).includes(
            parseResult.event.name as RelayEventName,
          ),
      )
      .map((parseResult) => parseResult.event);
  }
}
