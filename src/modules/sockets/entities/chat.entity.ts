import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes } from 'mongoose';
import { IUser, User } from 'src/modules/users/entities/user.entity';
import { ACTIVITY_TYPE } from 'src/modules/users/enums/activity.enum';
import { CHAT_TYPE } from '../enums/chat.enum';
import { IRoom, Room } from './room.entity';

@Schema({ _id: false, timestamps: false })
class Payload {
  @Prop({ type: String, enum: [''] })
  activity: string;

  @Prop({ type: Object })
  data: Record<string, any>;
}

const PayloadSchema = SchemaFactory.createForClass(Payload);
type IPayload = HydratedDocument<Payload>;

@Schema({ timestamps: true })
class Chat extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: Room.name, required: true })
  room: IRoom;

  @Prop({ type: String })
  message: string;

  @Prop({ type: [String] })
  media: string[];

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  from: IUser;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: User.name }], default: [] })
  to: IUser[];

  @Prop({ type: SchemaTypes.ObjectId, ref: Chat.name })
  replyTo?: IChat;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: User.name }], default: [] })
  deliveredTo: IUser[];

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: User.name }], default: [] })
  readBy: IUser[];

  @Prop({ type: String, enum: CHAT_TYPE, default: CHAT_TYPE.MESSAGE })
  type: CHAT_TYPE;

  @Prop({ type: PayloadSchema })
  payload: Payload;
}

const ChatSchema = SchemaFactory.createForClass(Chat);
type IChat = HydratedDocument<Chat>;

export { Chat, ChatSchema, IChat, IPayload, PayloadSchema, Payload };
