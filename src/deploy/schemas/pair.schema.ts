import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PairDocument = HydratedDocument<Pair>;

@Schema({ timestamps: true })
export class Pair {
  @Prop()
  symbol: string;
  @Prop()
  tokenContract: string;
  @Prop()
  pairContract: string;
}

export const PairSchema = SchemaFactory.createForClass(Pair);
