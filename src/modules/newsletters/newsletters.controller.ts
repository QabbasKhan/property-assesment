import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'src/common/utils/types.util';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { NewslettersService } from './newsletters.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ROLE } from '../users/enums/user.enum';
import { Paginate } from 'src/common/decorators/pagination.decorator';

@ApiTags('News-Letter')
@Controller({ path: 'news-letters', version: '1' })
export class NewslettersController {
  constructor(private readonly newslettersService: NewslettersService) {}

  @Auth(ROLE.SUPER_ADMIN)
  @Get('/all')
  async findAll(@Paginate() query: Pagination) {
    const data = await this.newslettersService.findAll(query);

    return { data };
  }

  @Auth(ROLE.SUPER_ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.newslettersService.findOne(id);

    return { data };
  }

  @Post('/create')
  async create(@Body() createNewsletterDto: CreateNewsletterDto) {
    const data = await this.newslettersService.create(createNewsletterDto);

    return { data };
  }

  @Auth(ROLE.SUPER_ADMIN)
  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    const data = await this.newslettersService.deleteOne(id);

    return { data };
  }
}
