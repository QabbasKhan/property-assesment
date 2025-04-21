import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { Pagination } from 'src/common/utils/types.util';
import { IUser } from 'src/modules/users/entities/user.entity';
import { Chat, IChat, IPayload } from '../entities/chat.entity';
import { ILastMessage, IRoom, IRoomUser, Room } from '../entities/room.entity';
import { CHAT_TYPE, MESSAGE } from '../enums/chat.enum';
import { PrivateSocketsGateway } from '../private-sockets.gateway';
import { StartChatDto } from '../dtos/create-message.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private readonly Chat: Model<IChat>,
    @InjectModel(Room.name) private readonly Room: Model<IRoom>,
    @Inject(forwardRef(() => PrivateSocketsGateway))
    private readonly privateSocket: PrivateSocketsGateway,
  ) {}

  async getRoom(id: string): Promise<IRoom> {
    const room = await this.Room.findOne({ _id: id }).lean();
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getUserRooms(
    user: IUser,
    pagination: Pagination,
    query: { search: string },
  ): Promise<{ rooms: IRoom[]; totalCount: number }> {
    const aggregation = [
      {
        $match: {
          'users.user': new mongoose.Types.ObjectId(user._id),
        },
      },
      {
        $unwind: {
          path: '$users',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'users.user',
          foreignField: '_id',
          as: 'users.user',
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                photo: 1,
                isOnline: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$users.user',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: '$_id',
          users: {
            $push: '$users',
          },
          lastMessage: {
            $first: '$lastMessage',
          },
          lastChatted: {
            $first: '$lastChatted',
          },
          createdAt: {
            $first: '$createdAt',
          },
        },
      },
      {
        $match: {
          ...(!!query.search && {
            $or: [
              {
                'users.user.firstName': {
                  $regex: query.search,
                  $options: 'i',
                },
              },
              {
                'users.user.lastName': {
                  $regex: query.search,
                  $options: 'i',
                },
              },
            ],
          }),
        },
      },
      {
        $count: 'totalCount',
      },
    ];

    const aggregationWithPagination = [
      ...aggregation.slice(0, -1),
      {
        $sort: { lastChatted: -1 } as { [key: string]: -1 | 1 },
      },
      {
        $skip: pagination.skip,
      },
      {
        $limit: pagination.limit,
      },
    ];

    const [data] = await this.Room.aggregate([
      {
        $facet: {
          rooms: aggregationWithPagination,
          totalCount: aggregation,
        },
      },
    ]);

    return {
      rooms: data.rooms,
      totalCount: data.totalCount[0]?.totalCount || 0,
    };
  }

  async getChatMessages(
    user: IUser,
    paginate: Pagination,
    query: { roomId: string; search: string },
  ) {
    const { skip, limit } = paginate;
    const { roomId, search } = query;

    const isAuthorized = await this.Room.exists({
      _id: roomId,
      'users.user': user._id,
    });
    if (!isAuthorized) {
      throw new BadRequestException('No Room Found');
    }

    const dbQuery = {
      ...(!!search && { message: { $regex: search, $options: 'i' } }),
      room: new mongoose.Types.ObjectId(roomId),
    };

    const data = await this.Chat.aggregate([
      { $match: dbQuery },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            ...(!!skip || !!limit ? [{ $skip: skip }, { $limit: limit }] : []),
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    return {
      chats: data[0].data,
      totalCount: data[0]?.total[0]?.count || 0,
    };
  }

  async createRoom(
    user: IUser,
    body: { userIds: string[]; child: string; booking: string },
  ): Promise<IRoom> {
    const users = [...body.userIds, user._id.toString()]?.map((id) => {
      return { user: new mongoose.Types.ObjectId(id) };
    });

    const roomObj = new this.Room({
      users,
      child: body.child,
      booking: body.booking,
    });

    const [room] = await Promise.all([
      roomObj.save().then((doc) =>
        doc.populate([
          {
            path: 'users.user',
            select: '_id firstName lastName photo socketIds',
          },
        ]),
      ),
    ]);

    return room;
  }

  async startChat(user: IUser, startChatDto: StartChatDto): Promise<IRoom> {
    let room: IRoom;
    let isNewRoom = false;

    // if (!startChatDto.message && !startChatDto.payload && !startChatDto.media) {
    //   throw new BadRequestException(
    //     'Message payload or media is required to start a chat',
    //   );
    // }

    room = (await this.findRoomHelper(
      {
        'users.user': {
          $all: [
            user._id,
            ...startChatDto.userIds.map(
              (id) => new mongoose.Types.ObjectId(id),
            ),
          ],
        },
        users: { $size: startChatDto.userIds.length + 1 },
      },
      {},
      false,
    )) as IRoom;

    if (!room) {
      room = await this.createRoom(user, {
        userIds: startChatDto.userIds,
        child: startChatDto.child,
        booking: startChatDto.booking,
      });
      isNewRoom = true;
    }

    if (
      startChatDto.type === CHAT_TYPE.ACTIVITY &&
      !startChatDto.payload?.activity
    ) {
      throw new BadRequestException('Activity type is missing in payload');
    }

    if (
      startChatDto.message ||
      startChatDto.payload ||
      startChatDto.media?.length
    ) {
      const messageData = await this.sendMessage(
        user,
        {
          roomId: room._id.toString(),
          message: startChatDto.message,
          media: startChatDto.media,
          type: startChatDto.type,
          payload: startChatDto.payload,
        },
        room,
      );
      room = messageData.room;
    }

    // fire the new room socket event
    if (isNewRoom) {
      const socketIds = room.users.reduce(
        (acc: string[], roomUser: { user: IUser; unreadCount: number }) => {
          if (roomUser.user._id.toHexString() !== user._id.toString()) {
            acc.push(...roomUser.user.socketIds);
          }
          return acc;
        },
        [],
      );

      this.privateSocket.server.to(socketIds).emit('new-room', { room });
    }

    return room as IRoom;
  }

  async sendMessage(
    user: IUser,
    body: MESSAGE,
    room: IRoom,
    client?: Socket,
  ): Promise<{ room: IRoom; chat: IChat }> {
    const { roomId, message, media = [], type, payload = {} } = body;

    const to = this.getReceiverIds(room.users, user._id.toString());
    const deliveredTo = this.getOnlineUsers(room.users);
    const readBy = this.getInChatUsers(room.users, room._id.toString());

    const chatObj = new this.Chat({
      room: roomId,
      from: user._id.toString(),
      message,
      media,
      payload,
      type,
      to,
      deliveredTo,
      readBy,
    });

    const [chat] = await Promise.all([
      chatObj.save().then((doc) =>
        doc.populate([
          {
            path: 'to',
            select: '_id firstName lastName photo socketIds',
          },
        ]),
      ),
    ]);

    if (client) {
      client.broadcast.to(roomId).emit('chat-message', { chat });
    } else {
      this.privateSocket.server.to(roomId).emit('chat-message', { chat });
    }

    room.lastMessage = {
      from: user._id.toString(),
      message,
      payload,
    } as ILastMessage;
    room.lastChatted = new Date();
    room.users.forEach((roomUser) => {
      if (
        to.includes(roomUser.user._id.toString()) &&
        !readBy.includes(roomUser.user._id.toString())
      ) {
        roomUser.unreadCount = (roomUser.unreadCount || 0) + 1;
      }
    });

    await room.save();

    return { room, chat };
  }

  async deleteMessage(id: string, user: IUser) {
    const chat = await this.Chat.findByIdAndUpdate(
      id,
      {
        $addToSet: { deletedBy: user._id },
      },
      { new: true, lean: true },
    );
    if (!chat) throw new NotFoundException('Message not found');

    this.privateSocket.server
      .to(chat.room.toString())
      .emit('chat-delete', { chat });

    return chat;
  }

  getReceiverIds(roomUsers: IRoomUser[], from: string): string[] {
    return roomUsers
      .filter((roomUser) => roomUser.user._id.toHexString() !== from)
      .map((roomUser) => roomUser.user._id.toHexString());
  }

  getOnlineUsers(roomUsers: IRoomUser[]): string[] {
    return roomUsers
      .filter((roomUser) => roomUser.user.isOnline === true)
      .map((roomUser) => roomUser.user._id.toString());
  }

  getInChatUsers(roomUsers: IRoomUser[], roomId: string): string[] {
    const socketIds = this.getSocketIdsInRoom(roomId);
    return roomUsers
      .filter((roomUser) =>
        roomUser.user.socketIds.some((socketId) =>
          socketIds.includes(socketId),
        ),
      )
      .map((roomUser) => roomUser.user._id.toHexString());
  }

  getSocketIdsInRoom(room: string): string[] {
    const roomSockets =
      this.privateSocket.server.sockets.adapter.rooms.get(room);
    if (roomSockets) {
      return Array.from(roomSockets);
    }
    return [];
  }

  /**
   * Retrieves a room or multiple rooms from the database based on the given filter.
   *
   * @param {Partial<IRoom>} filter - A MongoDB filter object.
   * @param {Partial<IRoom>} [select] - Optional projection to select specific fields.
   * @param {boolean} [multiple=false] - Whether to fetch multiple rooms or a single room.
   * @returns {Promise<IRoom | IRoom[]>} -Returns single or multiple rooms based on the filter.
   */
  async findRoomHelper(
    filter: object,
    select?: object,
    multiple: boolean = false,
  ): Promise<IRoom | IRoom[]> {
    return multiple
      ? await this.Room.find(filter, select)
      : await this.Room.findOne(filter, select);
  }

  async updateOneRoomHelper(
    filter: object,
    update: object,
    opt?: object,
  ): Promise<IRoom> {
    return await this.Room.findOneAndUpdate(filter, update, {
      new: true,
      ...opt,
    });
  }

  async updateChatsHelper(
    filter: object,
    update: object,
    opt?: object,
  ): Promise<void> {
    await this.Chat.updateMany(filter, update, {
      new: true,
      ...opt,
    });
  }
}
