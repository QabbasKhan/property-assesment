import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ROLE } from '../users/enums/user.enum';
import { CmsService } from './cms.service';
import { CMS_TYPE } from './enums/cms.enum';

@ApiTags('CMS')
@Controller({ path: 'cms', version: '1' })
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @ApiQuery({ type: String, name: 'pageName', required: true, enum: CMS_TYPE })
  @Get('/page/:pageName')
  async getPage(@Param('pageName') pageName: string) {
    const data = await this.cmsService.getPage(pageName);
    return { data };
  }

  @ApiQuery({ type: String, name: 'pageName', required: true, enum: CMS_TYPE })
  @ApiBody({ type: Object })
  @Auth(ROLE.SUPER_ADMIN)
  @Patch('/page/:pageName')
  async updatePage(
    @Param('pageName') pageName: CMS_TYPE,
    @Body() body: object,
  ) {
    const data = await this.cmsService.updatePage(pageName, body);
    return { data };
  }
}
