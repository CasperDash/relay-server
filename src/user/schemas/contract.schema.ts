import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ContractDocument = HydratedDocument<Contract>;

@Schema({ timestamps: true })
export class Contract {
  @Prop()
  ownerAccountHash: string;
  @Prop()
  contractHash: string;
  @Prop()
  createdAt: Date;
  @Prop()
  updatedAt: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
