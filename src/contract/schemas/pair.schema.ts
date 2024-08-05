import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type PairDocument = HydratedDocument<Pair>;

@Schema({ timestamps: true })
export class Pair {
  @Prop({ index: true, unique: true })
  @ApiProperty()
  symbol: string;
  @Prop()
  @ApiProperty()
  tokenContract: string;
  @Prop()
  @ApiProperty()
  pairContract: string;
}

export const PairSchema = SchemaFactory.createForClass(Pair);
