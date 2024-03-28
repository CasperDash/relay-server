import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop()
  deployHash: string;
  @Prop()
  accountHash: string;
  @Prop()
  transactionType: string;
  @Prop()
  amount: string;
  @Prop()
  cep18Hash?: string;
  @Prop()
  contractHash?: string;
  @Prop()
  entryPoint?: string;
  @Prop()
  createdAt: Date;
  @Prop()
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
