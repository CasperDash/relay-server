import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Pair } from "./pair.schema";
import { ApiProperty } from "@nestjs/swagger";

export type ContractDocument = HydratedDocument<Contract>;

@Schema({ timestamps: true })
export class Contract {
  @Prop()
  @ApiProperty()
  ownerAccountHash: string;
  @Prop()
  @ApiProperty()
  contractHash: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Pair" })
  @ApiProperty()
  paymentToken?: Pair;
  @Prop()
  @ApiProperty()
  createdAt: Date;
  @Prop()
  @ApiProperty()
  updatedAt: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
