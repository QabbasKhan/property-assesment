import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SubscriptionPackagesService } from './subscription-packages.service';
import { CreateSubscriptionPackageDto } from './dto/create-subscription-package.dto';
import { UpdateSubscriptionPackageDto } from './dto/update-subscription-package.dto';
import { ApiTags } from '@nestjs/swagger';
import { ROLE } from '../enums/user.enum';
import { Auth } from 'src/common/decorators/auth.decorator';

@ApiTags('Subscription Packages')
@Controller({ path: 'subscription-packages', version: '1' })
export class SubscriptionPackagesController {
  constructor(
    private readonly subscriptionPackagesService: SubscriptionPackagesService,
  ) {}

  @Auth(ROLE.ADMIN)
  @Post('create')
  async create(
    @Body() createSubscriptionPackageDto: CreateSubscriptionPackageDto,
  ) {
    const data = await this.subscriptionPackagesService.create(
      createSubscriptionPackageDto,
    );
    return { data };
  }

  @Get('/find-all')
  async findAll() {
    const data = await this.subscriptionPackagesService.findAll();
    return { data };
  }

  @Auth(ROLE.ADMIN)
  @Get('/admin/find-all')
  async adminFindAll() {
    const data = await this.subscriptionPackagesService.adminFindAll();
    return { data };
  }

  @Get('/find-one/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.subscriptionPackagesService.findOne(id);
    return { data };
  }

  @Auth(ROLE.ADMIN)
  @Patch('/update')
  async update(
    @Body() updateSubscriptionPackageDto: UpdateSubscriptionPackageDto,
  ) {
    const data = await this.subscriptionPackagesService.update(
      updateSubscriptionPackageDto,
    );
    return { data };
  }
}
