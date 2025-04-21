import { Module } from '@nestjs/common';
import { NewslettersService } from './newsletters.service';
import { NewslettersController } from './newsletters.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsLetter, NewsLetterSchema } from './entities/newsletter.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsLetter.name, schema: NewsLetterSchema },
    ]),
  ],
  controllers: [NewslettersController],
  providers: [NewslettersService],
})
export class NewslettersModule {}
