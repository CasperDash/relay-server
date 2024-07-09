import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Pair } from "./pair.schema";

export type ContractDocument = HydratedDocument<Contract>;

@Schema({ timestamps: true })
export class Contract {
  @Prop()
  ownerAccountHash: string;
  @Prop()
  contractHash: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Pair" })
  paymentToken?: Pair;
  @Prop()
  createdAt: Date;
  @Prop()
  updatedAt: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
