export interface EnvConfig {
  [key: string]: string;

  //BASIC CREDENTIALS
  PORT?: string;
  APP_NAME?: string;
  APP_VERSION?: string;
  WEB_HOSTED_URL?: string;
  API_HOSTED_URL?: string;

  // JWT CREDENTIALS
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;

  // ENCRYPTION CREDENTIALS
  ENCRYPTION_KEY?: string;
  ENCRYPTION_IV_LENGTH?: string;

  // DATABASE CREDENTIALS
  MONGODB_URI?: string;
  MONGODB_PASSWORD?: string;

  // SENDGRID CREDENTIALS
  EMAIL_FROM?: string;
  SENDGRID_USERNAME?: string;
  SENDGRID_PASSWORD?: string;

  // AWS CREDENTIALS
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_BUCKET_NAME?: string;
  AWS_BUCKET_LINK?: string;

  // SWAGGER CREDENTIALS
  SWAGGER_USERNAME?: string;
  SWAGGER_PASSWORD?: string;

  // STRIPE CREDENTIALS
  STRIPE_PUBLIC_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_LINK?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_CURRENCY?: string;

  // UPS CREDENTIALS
  UPS_CLIENT_ID?: string;
  UPS_CLIENT_SECRET?: string;
}
