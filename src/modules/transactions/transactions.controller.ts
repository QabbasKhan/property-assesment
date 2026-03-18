import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { Pagination } from 'src/common/utils/types.util';
import { Paginate } from 'src/common/decorators/pagination.decorator';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ROLE } from '../users/enums/user.enum';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { IUser } from '../users/entities/user.entity';

@ApiTags('Transactions')
@Controller({ path: 'transactions', version: '1' })
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Auth(ROLE.USER)
  @Get('user/my')
  async findMy(
    @GetUser() user: IUser,
    @Paginate() pagination: Pagination,
    @Query() query: { search: string },
  ) {
    const data = await this.transactionsService.findMy(user, pagination, query);
    return { data };
  }

  // @Auth(ROLE.ADMIN)
  @Get('admin/find-all')
  async adminFindAll(
    @Query() query: { search: string },
    @Paginate() pagination: Pagination,
  ) {
    const data = await this.transactionsService.adminFindAll(pagination, query);
    return { data };
  }
}
