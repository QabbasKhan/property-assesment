import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { INewsLetter, NewsLetter } from './entities/newsletter.entity';
import { Model } from 'mongoose';
import { Pagination } from 'src/common/utils/types.util';

@Injectable()
export class NewslettersService {
  constructor(
    @InjectModel(NewsLetter.name)
    private readonly NewsLetter: Model<INewsLetter>,
  ) {}

  async create(createNewsletterDto: CreateNewsletterDto): Promise<INewsLetter> {
    const isExist = await this.NewsLetter.findOne({
      email: createNewsletterDto.email,
    }).lean();

    if (isExist)
      throw new BadRequestException(
        'This email is already subscribed to our newsletter',
      );

    const subscriber = await this.NewsLetter.create(createNewsletterDto);

    return subscriber;
  }

  async findOne(queryId: string) {
    const query = await this.NewsLetter.findById(queryId).select('-updatedAt');

    if (!query)
      throw new BadRequestException('Subscriber with that id does not exist');

    return query;
  }

  async findAll(
    query: Pagination,
  ): Promise<{ newsletters: INewsLetter[]; totalCount: number }> {
    const { skip, limit } = query;

    const data = await this.NewsLetter.aggregate([
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            ...(!!skip && !!limit ? [{ $skip: skip }, { $limit: limit }] : []),
          ],
          total: [{ $count: 'total' }],
        },
      },
    ]);

    return {
      newsletters: data[0].data,
      totalCount: data[0].total[0]?.total || 0,
    };
  }

  async deleteOne(id: string): Promise<INewsLetter> {
    const isExist = await this.NewsLetter.findById(id).lean();
    if (!isExist) throw new BadRequestException('No Data Found with that id');

    const newsLetter = await this.NewsLetter.findByIdAndDelete(id);

    return newsLetter as INewsLetter;
  }
}
