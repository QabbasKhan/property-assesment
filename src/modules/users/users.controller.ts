import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { IUser } from './entities/user.entity';

import { ROLE } from './enums/user.enum';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/create-user.dto';
import { Pagination } from 'src/common/utils/types.util';
import { Paginate } from 'src/common/decorators/pagination.decorator';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth()
  @Get('/get-me')
  async getMe(@GetUser() user: IUser) {
    const data = await this.usersService.getMe(user);
    return { data };
  }

  // @Auth(ROLE.ADMIN)
  @Get('/find-all')
  async findAll(
    @Paginate() pagination: Pagination,
    @Query() query: { search?: string; status: string },
  ) {
    const data = await this.usersService.findAll(pagination, query);
    return { data };
  }

  @Auth(ROLE.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { data };
  }

  @Auth(ROLE.USER)
  @Post('buy-subscription')
  async buySubscription(
    @GetUser() user: IUser,
    @Body() buySubscriptionDto: { packageId: string },
  ) {
    const data = await this.usersService.buySubscription(
      user,
      buySubscriptionDto,
    );
    return { data };
  }

  @Auth(ROLE.ADMIN)
  @Patch('update-user')
  async updateOne(@Body() updateUserDto: UpdateUserDto) {
    const data = await this.usersService.updateOne(updateUserDto);
    return { data };
  }

  @Auth()
  @Patch('update-me')
  async updateMe(@GetUser() user: IUser, @Body() updateMeDto: UpdateMeDto) {
    const data = await this.usersService.updateMe(user, updateMeDto);
    return { data };
  }

  @Auth(ROLE.ADMIN)
  @Delete('delete-user/:id')
  async remove(@Param('id') id: string) {
    const data = await this.usersService.delete(id);

    return { data };
  }
}
