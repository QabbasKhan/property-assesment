import { BadRequestException, forwardRef, Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { bgBlue, blue, redBright, yellowBright } from 'cli-color';
import { Server, Socket } from 'socket.io';
import { GetWsUser } from 'src/common/decorators/get-user.decorator';
import { WsJwtMiddleware } from 'src/common/middlewares/ws-jwt.middleware';
import { createSocketLogger } from 'src/common/utils/helper.util';
import { ConfigService } from 'src/config/config.service';
import { IUser } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { ChatsService } from './chats/chats.service';
import { IRoom } from './entities/room.entity';
import { CHAT_TYPE, MESSAGE } from './enums/chat.enum';

@WebSocketGateway()
export class PrivateSocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly socketType = 'SOCKET';
  private readonly logger = createSocketLogger(this.socketType);

  @WebSocketServer() server: Server;
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    @Inject(forwardRef(() => ChatsService))
    private readonly chatService: ChatsService,
  ) {}

  async afterInit(server: Server) {
    console.log(bgBlue(`${this.socketType} GATEWAY INITIALIZED`));
    server.use(WsJwtMiddleware(this.configService, this.userService));
  }

  async handleConnection(client: Socket) {
    const user: IUser = client['user'];

    if (user) this.logger.logInfo(`${user.name} ${user.name} connected`);

    await Promise.all([
      this.userService.updateOneHelper(
        { _id: user._id },
        {
          socketIds: [
            ...user.socketIds.filter((id) =>
              this.server.sockets.sockets.has(id),
            ),
            client.id,
          ],
          isOnline: true,
        },
        { new: true },
      ),
      this.chatService.updateChatsHelper(
        { to: user._id },
        { $addToSet: { deliveredTo: user._id } },
      ),
    ]);

    const rooms = (await this.chatService.findRoomHelper(
      { 'users.user': user._id },
      { _id: 1 },
      true,
    )) as IRoom[];

    const roomIds = rooms.map((room) => room._id.toString());

    if (roomIds.length > 0) {
      client.broadcast.to(roomIds).emit('chat-delivered', { id: user._id });
    }
  }

  async handleDisconnect(client: Socket) {
    const user: IUser = client['user'];

    const updatedUser = await this.userService.updateOneHelper(
      { _id: user._id },
      { $pull: { socketIds: client.id } },
    );

    if (updatedUser?.socketIds?.length === 0) {
      updatedUser.isOnline = false;
      await updatedUser.save();
    }

    if (user) this.logger.logInfo(`${user.name} ${user.name} disconnected`);
  }

  @SubscribeMessage('join-room')
  async handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @GetWsUser() user: IUser,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      if (!payload.roomId) throw new BadRequestException('Payload Is Empty');

      client.join(payload.roomId);

      await Promise.all([
        this.chatService.updateChatsHelper(
          { to: user._id },
          { $addToSet: { readBy: user._id.toHexString() } },
        ),
        this.chatService.updateOneRoomHelper(
          { _id: payload.roomId, 'users.user': user._id },
          { 'users.$.unreadCount': 0 },
        ),
      ]);

      client.broadcast.to(payload.roomId).emit('chat-read', { id: user._id });

      this.logger.logSuccess(
        `${user.name} joined room: ${payload.roomId}`,
        'join-room',
      );
    } catch (error) {
      this.logger.logError(error, 'join-room');
    }
  }

  @SubscribeMessage('chat-message')
  async handleChatMessage(
    @GetWsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MESSAGE,
  ) {
    try {
      if (!payload.roomId) throw new BadRequestException('Payload Is Empty');

      const room = (await this.chatService.findRoomHelper({
        _id: payload.roomId,
      })) as IRoom;

      if (payload.type === CHAT_TYPE.ACTIVITY) {
        if (!payload.payload || !payload.payload.activity) {
          throw new BadRequestException('Activity type is missing in payload');
        }
      }

      const messageData = await this.chatService.sendMessage(
        user,
        payload,
        room,
        client,
      );

      const updatedRoom = messageData.room;

      const socketIds = updatedRoom.users.reduce((acc, roomUser) => {
        if (roomUser.user._id.toHexString() !== user._id.toHexString()) {
          acc.push(...roomUser.user.socketIds);
        }
        return acc;
      }, []);

      client.broadcast.to(socketIds).emit('update-room', { updatedRoom });

      this.logger.logSuccess(
        `${user.name} sent message in room: ${updatedRoom._id}`,
        'chat-message',
      );

      return { chat: messageData.chat };
    } catch (error) {
      this.logger.logError(error, 'chat-message');
    }
  }

  @SubscribeMessage('leave-room')
  async handleRoomLeave(
    @GetWsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      if (!payload.roomId) throw new BadRequestException('Payload is empty');

      client.leave(payload.roomId);

      this.logger.logSuccess(
        `${user.name} left room: ${payload.roomId}`,
        'leave-room',
      );
    } catch (error) {
      this.logger.logError(error, 'leave-room');
    }
  }
}
