import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Pair } from "./schemas/pair.schema";

@Injectable()
export class PairService {
  constructor(@InjectModel(Pair.name) private pairModel: Model<Pair>) {}
  async getBySymbol(symbol: string) {
    const pair = await this.pairModel.findOne({ symbol }).exec();
    if (!pair) {
      throw new NotFoundException(`Token ${symbol} is not supported`);
    }
    return pair;
  }

  async getByTokenContract(tokenContract: string) {
    return this.pairModel.findOne({ tokenContract });
  }

  async get() {
    return this.pairModel.find();
  }
}
