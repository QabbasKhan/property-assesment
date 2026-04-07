import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { compare, hash } from 'bcryptjs';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import {
  ROLE,
  STATUS,
  SUBSCRIPTION_STATUS,
} from 'src/modules/users/enums/user.enum';
import validator from 'validator';
import {
  ISubscriptionPackage,
  SubscriptionPackage,
} from '../subscription-packages/entities/subscription-package.entity';

@Schema({ timestamps: true })
class Subscription {
  @Prop({ type: String, default: null })
  subscriptionId: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: SubscriptionPackage.name,
    default: null,
  })
  package: string | ISubscriptionPackage;

  @Prop({
    type: String,
    enum: SUBSCRIPTION_STATUS,
    default: SUBSCRIPTION_STATUS.INACTIVE,
  })
  status: SUBSCRIPTION_STATUS;

  @Prop({ type: Date, default: null })
  currentPeriodStart: Date | null;

  @Prop({ type: Date, default: null })
  currentPeriodEnd: Date | null;

  @Prop({ type: Date, default: null })
  trialEnd: Date | null;

  @Prop({ type: String, default: null })
  trialPeriod: string;

  @Prop({ type: Boolean, default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ type: Number, default: 0 })
  availableAnalysis: number;
}

const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
type ISubscription = HydratedDocument<Subscription>;

@Schema({ timestamps: true })
class User {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String, unique: true, lowercase: true })
  slug: string;

  @Prop({
    type: String,
    unique: true,
    index: true,
    required: true,
    lowercase: true,
    validate: validator.isEmail,
  })
  email: string;

  @Prop({ type: String, default: 'default.png' })
  photo: string;

  @Prop({ type: String, select: false, required: true })
  password: string;

  @Prop({ type: String, select: false })
  passwordVisible: string;

  @Prop({ type: String, required: true })
  stripeCustomerId: string;

  // -----------------ASSOCIATIVE PROPS-----------------------

  @Prop({ type: String, enum: ROLE, required: true })
  role: ROLE;

  @Prop({ type: String, enum: STATUS, default: STATUS.ACTIVE })
  status: STATUS;

  // -----------------SUBSCRIPTION PROPS-----------------------
  @Prop({
    type: SubscriptionSchema,
    default: () => ({ status: SUBSCRIPTION_STATUS.INACTIVE }),
  })
  subscription: ISubscription;

  // -----------------GENERIC PROPS-----------------------

  @Prop({ type: Boolean, default: true })
  profileCompleted: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Boolean, default: false })
  isOnline: boolean;

  @Prop({ type: [String], default: [] })
  socketIds: string[];

  @Prop({ type: Number })
  passwordChangedAt: number;

  @Prop({ type: Boolean, default: true })
  inAppNotifications: boolean;

  // -----------------DYNAMIC PROPS-----------------------

  // -----------------METHODS-----------------------

  changedPasswordAfter = function (JWTTimestamp: number) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        new Date(this.passwordChangedAt).getTime() / 1000 + '',
        10,
      );

      return JWTTimestamp < changedTimestamp;
    }

    return false;
  };

  correctPassword = async function (
    candidatePassword: string,
    userPassword: string,
  ) {
    return await compare(candidatePassword, userPassword);
  };
}

const UserSchema = SchemaFactory.createForClass(User);
type IUser = HydratedDocument<User>;

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.passwordVisible = this.password;
  this.password = await hash(this.password, 12);

  if (this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

const populateFields = function (next) {
  this.populate([]);
  next();
};

UserSchema.pre(/^find/, populateFields);

UserSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
) {
  return await compare(candidatePassword, userPassword);
};

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      new Date(this.passwordChangedAt).getTime() / 1000 + '',
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

export { IUser, User, UserSchema };
