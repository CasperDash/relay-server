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
  validate(deploy: any, args: ValidationArguments) {
    const options = args.constraints[0];
    if (DeployUtil.deployFromJson(deploy).err) return false;
    return !(
      options?.isTransfer &&
      !DeployUtil.deployFromJson(deploy).unwrap().isTransfer()
    );
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
