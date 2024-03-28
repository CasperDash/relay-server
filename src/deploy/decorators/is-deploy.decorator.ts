import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { DeployUtil } from "casper-js-sdk";

@ValidatorConstraint({ async: true })
export class IsDeployDecorator implements ValidatorConstraintInterface {
  constructor() {}
  validate(deployJson: any, args: ValidationArguments) {
    const options = args.constraints[0];
    const deploy = DeployUtil.deployFromJson(deployJson).unwrapOr(null);
    if (!deploy) return false;
    return !(options?.isTransfer && deploy.isTransfer());
  }

  defaultMessage(args?: ValidationArguments): string {
    return `${args.property} is an invalid ${
      args.constraints[0]?.isTransfer ? "transfer" : ""
    } deploy`;
  }
}

export function IsDeploy(
  options?: { isTransfer: boolean },
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [options],
      validator: IsDeployDecorator,
    });
  };
}
