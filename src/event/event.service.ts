import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventName, EventStream } from "casper-js-sdk";
import { RpcService } from "../common/rpc.service";
import { Parser } from "@make-software/ces-js-parser";
import { CasperService } from "../common/casper.service";
import { ContractService } from "../contract/contract.service";
import { TransactionService } from "../contract/transaction.service";

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
    private contractService: ContractService,
    private transactionService: TransactionService,
  ) {
    this.eventStream = new EventStream(this.rpcService.getEventStreamUrl());
  }

  onModuleInit() {
    this.eventStream.start();
    this.eventStream.subscribe(
      EventName.DeployProcessed,
      async (result: any) => {
        const deployHash = result.body.DeployProcessed.deploy_hash;
        const events = await this.parseRelayEvents(result);
        for (const event of events) {
          switch (event.name) {
            case EVENT_NAMES.DEPOSIT: {
              const owner: string = event.data["owner"].value();
              const amount: string = event.data["amount"].value();
              await this.transactionService.create(
                deployHash,
                "deposit",
                owner.slice(13),
                amount,
              );
              break;
            }
            case EVENT_NAMES.REGISTER: {
              const owner: string = event.data["owner"].value();
              const contractHash: string = event.data["contract_hash"].value();
              await this.contractService.createOrUpdateContract(
                owner.slice(13),
                contractHash.slice(9),
              );
              break;
            }
            case EVENT_NAMES.CALL_ON_BEHALF:
              const caller: string = event.data["caller"].value();
              const contractHash: string = event.data["contract_hash"].value();
              const gasAmount: string = event.data["gas_amount"].value();
              const entryPoint: string = event.data["entry_point"].value();
              const cep18Hash = event.data["cep18_hash"].value().some
                ? event.data["cep18_hash"].value().val.toJSON().slice(9)
                : undefined;
              await this.transactionService.create(
                deployHash,
                "spend",
                caller.slice(13),
                gasAmount,
                cep18Hash,
                contractHash.slice(9),
                entryPoint,
              );
              break;
          }
        }
      },
    );
  }

  async parseRelayEvents(result: any) {
    try {
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
    } catch (e) {
      return [];
    }
  }
}
