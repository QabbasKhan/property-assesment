import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { Cms, CmsSchema } from './entities/cms.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cms.name, schema: CmsSchema }])],
  controllers: [CmsController],
  providers: [CmsService],
})
export class CmsModule {}
