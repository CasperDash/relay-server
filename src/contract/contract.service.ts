import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Contract } from "./schemas/contract.schema";

@Injectable()
export class ContractService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<Contract>,
  ) {}

  async createOrUpdateContract(ownerAccountHash: string, contractHash: string) {
    return this.contractModel.updateOne(
      {
        contractHash,
      },
      {
        ownerAccountHash,
      },
      {
        upsert: true,
      },
    );
  }

  async getContracts(accountHash: string) {
    return this.contractModel
      .find({ ownerAccountHash: accountHash })
      .populate("paymentToken");
  }

  async getContractByHash(contractHash: string) {
    return this.contractModel
      .findOne({ contractHash })
      .populate("paymentToken");
  }
}
