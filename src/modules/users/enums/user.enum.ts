export enum ROLE {
  ADMIN = 'admin',
  USER = 'user',
}

export enum STATUS {
  ACTIVE = 'active',
  PENDING_VERIFICATION = 'pending-verification',
  INACTIVE = 'inactive',
}

export enum SUBSCRIPTION_STATUS {
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
  INACTIVE = 'inactive', // custom local state (before subscription created)
}
