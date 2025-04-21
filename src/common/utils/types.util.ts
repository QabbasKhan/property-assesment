export type Pagination = {
  skip: number;
  limit: number;
};

export type UpsUrls = {
  oauth: string;
  addressValidation: string;
  rating: string;
};

export type UpsTransactionSrc = 'testing' | 'med-supplies';

export type Address = {
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type ProductInfo = {
  length: number; // inches
  width: number; // inches
  height: number; // inches

  weight: number; // pounds

  quantity: number;
};
