import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @ApiProperty()
  @Prop()
  deployHash: string;
  @ApiProperty()
  @Prop()
  accountHash: string;
  @ApiProperty()
  @Prop()
  transactionType: string;
  @ApiProperty()
  @Prop()
  amount: string;
  @ApiProperty()
  @Prop()
  cep18Hash?: string;
  @ApiProperty()
  @Prop()
  contractHash?: string;
  @ApiProperty()
  @Prop()
  entryPoint?: string;
  @ApiProperty()
  @Prop()
  createdAt: Date;
  @ApiProperty()
  @Prop()
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
