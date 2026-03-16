import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  PACKAGE_INTERVAL,
  PACKAGE_STATUS,
  PACKAGE_TYPE,
} from '../../enums/package.enum';

@Schema({ timestamps: true })
export class SubscriptionPackage {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: String, enum: PACKAGE_TYPE, required: true })
  type: PACKAGE_TYPE;

  @Prop({ type: String, enum: PACKAGE_INTERVAL, required: true })
  interval: PACKAGE_INTERVAL;

  @Prop({ type: Boolean, default: false })
  hasTrial: boolean;

  @Prop({ type: String, required: true })
  stripePriceId: string;

  @Prop({ type: String, required: true })
  stripeProductId: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: Number, default: 0 })
  totalAnalysis: number;

  @Prop({ type: String, enum: PACKAGE_STATUS, default: PACKAGE_STATUS.ACTIVE })
  status: PACKAGE_STATUS;
}

const SubscriptionPackageSchema =
  SchemaFactory.createForClass(SubscriptionPackage);
type ISubscriptionPackage = HydratedDocument<SubscriptionPackage>;
export { ISubscriptionPackage, SubscriptionPackageSchema };
