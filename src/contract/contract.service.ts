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
    const contract = await this.contractModel.findOne({ contractHash });
    if (contract) {
      if (contract.ownerAccountHash === ownerAccountHash) {
        return contract;
      }
      contract.ownerAccountHash = ownerAccountHash;
      return contract.save();
    }
    return this.contractModel.create({
      ownerAccountHash,
      contractHash,
    });
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
