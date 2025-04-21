import { HttpStatus } from '@nestjs/common';
import { bgBlue, blueBright, green, redBright, yellowBright } from 'cli-color';
import { randomBytes } from 'crypto';
import slugify from 'slugify';

const normalWord = (word?: string): string =>
  word.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, '$1');

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const messages = Object.keys(err.keyValue).map(
    (key) =>
      `Duplicate field ${
        normalWord(key) || 'value'
      }: ${value}. Please use another ${normalWord(key) || 'value'}`,
  );
  return messages;
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map(
    (el: any) => `Invalid input: ${el?.message}`,
  );

  return errors;
};

const handleCastErrorDB = (err: any) => [`Invalid ${err.path}: ${err.value}.`];

export const createSocketLogger = (socketType: string) => {
  const getPrefix = (messageName?: string) =>
    bgBlue(`[${socketType}${messageName ? `::${messageName}` : ''}]`);

  return {
    logInfo: (msg: string, messageName?: string) =>
      console.log(`${getPrefix(messageName)} ${msg}`),

    logSuccess: (msg: string, messageName?: string) =>
      console.log(`${getPrefix(messageName)} ${green(msg)}`),

    logWarning: (msg: string, messageName?: string) =>
      console.log(`${getPrefix(messageName)} ${yellowBright(msg)}`),

    logError: (msg: string | Error, messageName?: string) =>
      console.error(
        `${getPrefix(messageName)} ${redBright(typeof msg === 'string' ? msg : msg.message)}`,
      ),
  };
};

export const HttpErrorHandlingFn = (
  err: any,
): {
  error: { status: string; message: { error: string[] } };
  httpStatusCode: number;
} => {
  let error: any = {};
  let httpStatusCode: number = 400;

  if ('BadRequestException' == err.name) {
    error = { status: 'fail', message: { error: [err.message] } };
    httpStatusCode = HttpStatus.BAD_REQUEST;
  } else if ('NotFoundException' == err.name) {
    error = { status: 'fail', message: { error: [err.message] } };
    httpStatusCode = HttpStatus.NOT_FOUND;
  } else if (err.statusCode == 401) {
    error = { status: 'fail', message: { error: [err.message] } };
    httpStatusCode = HttpStatus.UNAUTHORIZED;
  } else if (err.statusCode == 402) {
    error = { status: 'fail', message: { error: [err.message] } };
    httpStatusCode = HttpStatus.PAYMENT_REQUIRED;
  } else {
    error = {
      status: 'fail',
      message: {
        error: Array.isArray(err?.message) ? err.message : [err.message],
      },
    };
    httpStatusCode = err.status || HttpStatus.BAD_REQUEST;
  }

  return { error, httpStatusCode };
};

export const MongoErrorHandlingFn = (
  err: any,
): {
  error: { status: string; message: { error: string[] } };
  httpStatusCode: number;
} => {
  let error: any = {};
  let httpStatusCode: number = 400;

  if (err.code === 11000) {
    error = {
      status: 'fail',
      message: { error: handleDuplicateFieldsDB(err) },
    };
    httpStatusCode = HttpStatus.CONFLICT;
  } else if (err.name === 'ValidationError') {
    error = {
      status: 'fail',
      message: { error: handleValidationErrorDB(err) },
    };
    httpStatusCode = HttpStatus.BAD_REQUEST;
  } else if ('CastError' == err.name) {
    error = { status: 'fail', message: { error: handleCastErrorDB(err) } };
    httpStatusCode = HttpStatus.NOT_FOUND;
  } else {
    error = {
      status: 'fail',
      message: {
        error: Array.isArray(err?.message) ? err.message : [err.message],
      },
    };
    httpStatusCode = err.status || HttpStatus.BAD_REQUEST;
  }

  return { error, httpStatusCode };
};

export const matchValueInArray = (array: string[], value: string) => {
  return array.includes(value);
};

export const matchArrayWithArray = (array1: string[], array2: string[]) => {
  return array1.every((value) => array2.includes(value));
};

export const generateOtpCode = (length: number = 6): number => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};

export const generateRandomPassword = (length: number = 12): string => {
  const allCharacters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@';
  const charactersLength = allCharacters.length;
  const randomIndices = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += allCharacters[randomIndices[i] % charactersLength];
  }

  return password;
};

export const generateSlug = (str: string): string =>
  `${slugify(str.substring(0, 10), { lower: true, trim: true })}-${generateOtpCode(4)}`;

export const hasDuplicates = (array: string[]) => {
  const set = new Set(array);
  return set.size !== array.length;
};

export const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const toCamelCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_match, chr) => chr.toUpperCase())
    .replace(/^([A-Z])/, (match) => match.toLowerCase());
};

export const createProductId = (productName: string, length = 12): string => {
  const initials = productName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  // Generate a random number string of the specified length
  const randomNumbers = Math.floor(
    Math.random() * Math.pow(10, length - initials.length),
  )
    .toString()
    .padStart(length - initials.length, '0');

  // Combine initials and random numbers
  return initials + randomNumbers;
};

export const createBookingId = (length = 9): string => {
  const initials = 'BK-';

  // Generate a random number string of the specified length
  const randomNumbers = Math.floor(
    Math.random() * Math.pow(10, length - initials.length),
  )
    .toString()
    .padStart(length - initials.length, '0');

  // Combine initials and random numbers
  return initials + randomNumbers;
};
