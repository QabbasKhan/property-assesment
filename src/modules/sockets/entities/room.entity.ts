import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { IUser, User } from 'src/modules/users/entities/user.entity';
import { ROOM_STATUS } from '../enums/room.enum';
import { IPayload, Payload, PayloadSchema } from './chat.entity';

@Schema({ timestamps: true })
class RoomUser extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: User.name,
    required: true,
  })
  user: IUser;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;
}
const RoomUserSchema = SchemaFactory.createForClass(RoomUser);
type IRoomUser = HydratedDocument<RoomUser>;

@Schema()
class LastMessage extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: User.name })
  from: string;

  @Prop({ type: String })
  message: string;

  @Prop({ type: Object })
  payload: Payload;
}
const LastMessageSchema = SchemaFactory.createForClass(LastMessage);
type ILastMessage = HydratedDocument<LastMessage>;

@Schema({ timestamps: true })
class Room extends Document {
  @Prop({ type: [RoomUserSchema] })
  users: IRoomUser[];

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name })
  child: IUser | Types.ObjectId;


  @Prop({ type: String, enum: ROOM_STATUS, default: ROOM_STATUS.ACTIVE })
  status: ROOM_STATUS;

  @Prop({ type: Date, default: Date.now() })
  lastChatted: Date;

  @Prop({ type: LastMessageSchema })
  lastMessage: ILastMessage;
}

const RoomSchema = SchemaFactory.createForClass(Room);
type IRoom = HydratedDocument<Room>;

const populateFields = function (next) {
  this.populate([
    {
      path: 'users.user',
    },
  ]);
  next();
};

RoomSchema.pre(/^find/, populateFields);
export { ILastMessage, IRoom, IRoomUser, Room, RoomSchema };
