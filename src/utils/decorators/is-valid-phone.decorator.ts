import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import {
  isPossibleNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';

export interface IsValidPhoneNumberOptions extends ValidationOptions {
  countryCodes: string[];
  message: string;
}

export function IsValidPhoneNumber(options: IsValidPhoneNumberOptions) {
  return function (object: object, propertyName: string, _index?: number) {
    registerDecorator({
      name: 'isValidPhoneNumber',
      target: object.constructor,
      propertyName,
      constraints: [],
      options,
      validator: {
        validate(value: any, args: ValidationArguments) {
          try {
            const countryCodes = options.countryCodes;
            const parsed = parsePhoneNumberFromString(value);

            if (!isPossibleNumber(value)) {
              return false;
            }

            if (!countryCodes.includes(parsed.country)) {
              return false;
            }

            return true;
          } catch (error) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const property = args.property;
          return `${property} is not a valid phone number for any of the specified countries`;
        },
      },
    });
  };
}
