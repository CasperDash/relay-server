import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from "@nestjs/common";
import { CLPublicKey } from "casper-js-sdk";

@Injectable()
export class PublicKeyValidationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    try {
      CLPublicKey.fromHex(value);
      return value;
    } catch (err) {
      throw new BadRequestException("Invalid public key");
    }
  }
}
