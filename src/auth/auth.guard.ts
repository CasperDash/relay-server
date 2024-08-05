import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CLPublicKey,
  decodeBase16,
  verifyMessageSignature,
} from "casper-js-sdk";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers["x-signature"];
    const publicKey = request.body.publicKey;
    const timestamp = request.body.timestamp;

    const message = JSON.stringify(request.body);
    if (!signature) {
      throw new UnauthorizedException();
    }
    // Verify signature
    const isValid = verifyMessageSignature(
      CLPublicKey.fromHex(publicKey),
      message,
      decodeBase16(signature),
    );
    if (!isValid) {
      throw new UnauthorizedException();
    }
    const TIMEOUT = Number(this.configService.get("TIMEOUT_IN_SEC"));
    if (timestamp + TIMEOUT * 1000 <= Date.now()) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
