import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';

export function IsBetween(
  min: number,
  max: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBetween',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: {
        validate(value: number, args: ValidationArguments) {
          const [minValue, maxValue] = args.constraints;
          return (
            typeof value === 'number' && value >= minValue && value <= maxValue
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [minValue, maxValue] = args.constraints;
          return `${args.property} must be between ${minValue} and ${maxValue}`;
        },
      },
    });
  };
}

//// handle string //////
export function IsInRange(
  minValue: number,
  maxValue: number,
  validationOptions?: ValidationOptions,
): (object: object, propertyName: string) => void {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isInRange',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [minValue, maxValue],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          const [min, max] = args.constraints;

          if (typeof value === 'number') {
            return value >= min && value <= max;
          } else if (typeof value === 'string') {
            return value.length >= min && value.length <= max;
          }

          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          const [min, max] = args.constraints;
          return `${args.property} must be in range between ${min} and ${max}`;
        },
      },
    });
  };
}
