import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';
import { FLAG, SENDER_MODE } from '../enums/notification.enum';

@Schema()
class Payload {
  @Prop({
    type: String,
  })
  room: string;
}

const PayloadSchema = SchemaFactory.createForClass(Payload);

@Schema({ timestamps: true })
export class Notification {
  // ==================== REQUIRED PARAMS ==========================

  @Prop({
    type: String,
    enum: SENDER_MODE,
    required: [true, 'sender mode is required'],
  })
  senderMode: SENDER_MODE;

  @Prop({
    type: String,
    enum: FLAG,
    required: [true, 'flag is required'],
  })
  flag: FLAG;

  @Prop({
    type: String,
    required: [true, 'message is required'],
  })
  message: string;

  @Prop({
    type: String,
    required: [true, 'title is required'],
  })
  title: string;

  // ==================== OPTIONAL PARAMS ==========================

  @Prop({
    type: PayloadSchema,
  })
  payload: Payload;

  @Prop({
    type: Boolean,
    default: false,
  })
  seen: boolean;

  // ==================== RELATIONAL PARAMS ==========================

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    default: null,
  })
  sender: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: [true, 'receiver is required'],
  })
  receiver: Types.ObjectId;
}

export type INotification = HydratedDocument<Notification>;

export const NotificationSchema = SchemaFactory.createForClass(Notification);
