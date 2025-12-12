import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Paginate } from 'src/common/decorators/pagination.decorator';
import { Pagination } from 'src/common/utils/types.util';
import { IUser } from 'src/modules/users/entities/user.entity';
import { ROLE } from 'src/modules/users/enums/user.enum';
import { StartChatDto } from '../dtos/create-message.dto';
import { ChatsService } from './chats.service';
import { QueryParams } from 'src/common/decorators/query.param.decorator';

@ApiTags('Chats')
@Controller({ path: 'chats', version: '1' })
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  // @QueryParams('search')
  // @Auth(ROLE.PARENT, ROLE.TEACHER)
  // @Get('/')
  // async getUserRooms(
  //   @GetUser() user: IUser,
  //   @Paginate() paginate: Pagination,
  //   @Query() query: { search: string },
  // ) {
  //   const data = await this.chatsService.getUserRooms(user, paginate, query);
  //   return { data };
  // }

  // @Auth(ROLE.PARENT, ROLE.TEACHER)
  // @Get('/room/:id')
  // async getRoomById(@Param('id') id: string) {
  //   const data = await this.chatsService.getRoom(id);
  //   return { data };
  // }

  // @QueryParams('roomId', 'search')
  // @Auth(ROLE.PARENT, ROLE.TEACHER)
  // @Get('/messages')
  // async getChatMessages(
  //   @GetUser() user: IUser,
  //   @Paginate() paginate: Pagination,
  //   @Query() query: { roomId: string; search: string },
  // ) {
  //   if (!query.roomId) throw new BadRequestException('roomId is missing');
  //   const data = await this.chatsService.getChatMessages(user, paginate, query);
  //   return { data };
  // }

  // @Auth(ROLE.PARENT, ROLE.TEACHER)
  // @Post('/start-chat')
  // async startChat(@GetUser() user: IUser, @Body() startChatDto: StartChatDto) {
  //   const data = await this.chatsService.startChat(user, startChatDto);
  //   return { data };
  // }

  // @Auth(ROLE.PARENT, ROLE.TEACHER)
  // @Delete('/delete-message/:id')
  // async deleteMessage(@Param('id') id: string, @GetUser() user: IUser) {
  //   const data = await this.chatsService.deleteMessage(id, user);

  //   return { data };
  // }
}
