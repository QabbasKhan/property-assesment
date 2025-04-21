import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { bgGreen, italic } from 'cli-color';
import { Server } from 'socket.io';
import { Socket } from 'socket.io-client';
import { IUser } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';

@WebSocketGateway()
export class PrivateSocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  constructor(private readonly userService: UsersService) {}

  async afterInit(_server: Server) {
    console.log(bgGreen('PUBLIC SOCKET GATEWAY INITIALIZED'));
  }

  // when user joins the app
  async handleConnection(client: Socket) {
    let user: IUser = client['user'];
    user = await this.userService.updateOneHelper(
      { _id: user._id },
      {
        socketIds: [
          ...user.socketIds.filter((id) => this.server.sockets.sockets.has(id)),
          client.id,
        ],
        isOnline: true,
      },
      {
        new: true,
      },
    );
    if (!!user) console.log(italic(`User Connected: ${user?._id}`));
  }

  // when user disconnects with the app
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
    if (!!user) console.log(italic(`User Disconnected: ${user?.id}`));
  }

  @SubscribeMessage('test')
  async test(@ConnectedSocket() client: Socket) {
    console.log('test');
  }
}
