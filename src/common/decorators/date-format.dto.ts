import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsDateStringConstraint implements ValidatorConstraintInterface {
  validate(dateStr: any) {
    if (typeof dateStr !== 'string') return false;

    // Regex for MM/DD/YYYY format
    // const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;

    // Regex for YYYY-MM-DD format
    const regex = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    return regex.test(dateStr);
  }

  defaultMessage() {
    return 'Date must be in the format MM/DD/YYYY';
  }
}

export function IsDateFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateStringConstraint,
    });
  };
}
