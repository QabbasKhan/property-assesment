import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubscriptionPackageDto } from './dto/create-subscription-package.dto';
import { UpdateSubscriptionPackageDto } from './dto/update-subscription-package.dto';
import {
  ISubscriptionPackage,
  SubscriptionPackage,
} from './entities/subscription-package.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { StripeService } from 'src/shared/stripe.service';
import { PACKAGE_STATUS } from '../enums/package.enum';

@Injectable()
export class SubscriptionPackagesService {
  constructor(
    @InjectModel(SubscriptionPackage.name)
    private readonly SubscriptionPackages: Model<ISubscriptionPackage>,
    private readonly stripeService: StripeService,
  ) {}

  async create(createSubscriptionPackageDto: CreateSubscriptionPackageDto) {
    const [stripeProductError, stripeProduct] =
      await this.stripeService.createProduct(
        createSubscriptionPackageDto.name,
        createSubscriptionPackageDto.description,
        { type: createSubscriptionPackageDto.type },
      );

    if (stripeProductError) {
      throw new BadRequestException(stripeProductError.message);
    }

    const [stripePriceError, stripePrice] =
      await this.stripeService.createPrice(
        stripeProduct.id,
        createSubscriptionPackageDto.price,
        'usd',
        createSubscriptionPackageDto.interval,
      );

    if (stripePriceError) {
      throw new BadRequestException(stripePriceError.message);
    }

    createSubscriptionPackageDto.stripePriceId = stripePrice.id;
    createSubscriptionPackageDto.stripeProductId = stripeProduct.id;

    console.log(createSubscriptionPackageDto);

    const subscriptionPackage = await this.SubscriptionPackages.create({
      ...createSubscriptionPackageDto,
    });

    return subscriptionPackage;
  }

  async findAll() {
    const data = await this.SubscriptionPackages.find({
      status: PACKAGE_STATUS.ACTIVE,
    }).sort({ price: 1 });

    return data;
  }

  async adminFindAll() {
    const data = await this.SubscriptionPackages.find().sort({ price: 1 });

    return data;
  }

  async findOne(id: string) {
    const data = await this.SubscriptionPackages.findById(id);
    if (!data) throw new NotFoundException('Package Not Found');

    return data;
  }

  async update(updateSubscriptionPackageDto: UpdateSubscriptionPackageDto) {
    const { id, ...rest } = updateSubscriptionPackageDto;

    const pkg = await this.SubscriptionPackages.findById(id);
    if (!pkg) throw new NotFoundException('Package Not Found');

    let updatedPriceId: string | null = null;
    if (rest?.price && rest?.price !== pkg.price) {
      const [stripePriceError, stripePrice] =
        await this.stripeService.changeProductPrice(
          pkg.stripeProductId,
          rest.price,
          pkg.stripePriceId,
        );
      if (stripePriceError) {
        throw new BadRequestException(stripePriceError.message);
      }
      updatedPriceId = stripePrice.id;
    }

    const updatedPkg = await this.SubscriptionPackages.findByIdAndUpdate(
      id,
      { ...rest, ...(updatedPriceId && { stripePriceId: updatedPriceId }) },
      { new: true },
    );

    return updatedPkg;
  }

  async findOneHelper(filter: any) {
    return await this.SubscriptionPackages.findOne(filter);
  }
}
