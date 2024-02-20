import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Pair } from "./schemas/pair.schema";

@Injectable()
export class PairService {
  constructor(@InjectModel(Pair.name) private pairModel: Model<Pair>) {}
  async getBySymbol(symbol: string) {
    return this.pairModel.findOne({ symbol });
  }

  async getByTokenContract(tokenContract: string) {
    return this.pairModel.findOne({ tokenContract });
  }
}
