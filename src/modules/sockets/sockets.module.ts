import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';

import {
  Notification,
  NotificationSchema,
} from './entities/notification.entity';
import { PrivateSocketsGateway } from './private-sockets.gateway';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { Room, RoomSchema } from './entities/room.entity';
import { Chat, ChatSchema } from './entities/chat.entity';
import { ChatsService } from './chats/chats.service';
import { ChatsController } from './chats/chats.controller';

@Global()
@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
  ],
  controllers: [NotificationsController, ChatsController],
  providers: [NotificationsService, PrivateSocketsGateway, ChatsService],
  exports: [NotificationsService, PrivateSocketsGateway, ChatsService],
})
export class SocketsModule {}
