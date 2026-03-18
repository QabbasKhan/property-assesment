import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';
import { SubscriptionPackage } from 'src/modules/users/subscription-packages/entities/subscription-package.entity';

@Schema({ timestamps: true })
class Transaction {
  @Prop({ type: String, required: true })
  transactionId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  user: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: SubscriptionPackage.name,
    required: true,
  })
  package: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({
    type: String,
    enum: ['subscription-purchase', 'subscription-renewal'],
    required: true,
  })
  type: string;

  @Prop({ type: String, default: null })
  invoice: string;
}

const TransactionSchema = SchemaFactory.createForClass(Transaction);
type ITransaction = HydratedDocument<Transaction>;

export { Transaction, TransactionSchema, ITransaction };
