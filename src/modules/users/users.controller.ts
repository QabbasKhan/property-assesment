import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { IUser } from './entities/user.entity';

import { ROLE } from './enums/user.enum';
import { UsersService } from './users.service';

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

  @Auth(ROLE.ADMIN)
  @Delete('delete-user/:id')
  async remove(@Param('id') id: string) {
    const data = await this.usersService.delete(id);

    return { data };
  }
}
