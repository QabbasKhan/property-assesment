import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { EmailService } from 'src/shared/email.service';
import { ErrorLogService } from 'src/shared/error-log.service';
import { IUser, User } from './entities/user.entity';
import { ROLE, STATUS } from './enums/user.enum';
import { Pagination } from 'src/common/utils/types.util';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/create-user.dto';
import { SubscriptionPackagesService } from './subscription-packages/subscription-packages.service';
import { NotificationsService } from '../sockets/notifications/notifications.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FLAG } from '../sockets/enums/notification.enum';
import { SENDER_MODE } from '../sockets/enums/notification.enum';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly Users: Model<IUser>,
    private readonly subscriptionPackagesService: SubscriptionPackagesService,
    private readonly emailService: EmailService,
    private readonly transactionsService: TransactionsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationService: NotificationsService,
  ) {}

  async getMe(user: IUser): Promise<IUser> {
    if (user.status !== STATUS.ACTIVE)
      throw new UnauthorizedException('User is not active');

    await user.populate('subscription.package');

    return user;
  }

  async findOne(id: string): Promise<IUser> {
    const user = await this.Users.findById(id).populate('subscription.package');
    if (!user || user.isDeleted) throw new NotFoundException('User not found');
    return user;
  }

  async updateOne(updateUserDto: UpdateUserDto): Promise<IUser> {
    const user = await this.Users.findByIdAndUpdate(
      updateUserDto.id,
      { status: updateUserDto.status },
      { new: true },
    );
    await user.populate('subscription.package');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMe(user: IUser, updateMeDto: UpdateMeDto): Promise<IUser> {
    const updatedUser = await this.Users.findByIdAndUpdate(
      user._id,
      updateMeDto,
      {
        new: true,
      },
    );
    await user.populate('subscription.package');

    if (!updatedUser) throw new NotFoundException('User not found');
    return updatedUser;
  }

  async findAll(
    pagination: Pagination,
    query: { search?: string; status?: string },
  ) {
    const filter: any = {
      role: { $ne: ROLE.ADMIN },
      ...(query.search && {
        $or: [
          { name: { $regex: query.search, $options: 'i' } },
          { email: { $regex: query.search, $options: 'i' } },
        ],
      }),
      isDeleted: false,
      ...(query.status && query.status !== 'all' && { status: query.status }),
    };

    const [data] = await this.Users.aggregate([
      { $match: filter },
      {
        $facet: {
          users: [
            { $sort: { createdAt: -1 } },
            { $skip: pagination?.skip || 0 },
            { $limit: pagination?.limit || 10 },
            {
              $lookup: {
                from: 'subscriptionpackages',
                localField: 'subscription.package',
                foreignField: '_id',
                as: 'subscription.package',
              },
            },
            {
              $unwind: {
                path: '$subscription.package',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'analysis',
                localField: '_id',
                foreignField: 'user',
                as: 'analysis',
              },
            },
            { $addFields: { analysisCount: { $size: '$analysis' } } },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                status: 1,
                subscription: 1,
                analysisCount: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    return { data: data.users || [], total: data.totalCount[0]?.count || 0 };
  }
  // SOFT DELETE
  async delete(id: string): Promise<IUser> {
    const user = await this.Users.findByIdAndUpdate(id, {
      isDeleted: true,
      status: STATUS.INACTIVE,
    });
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  // PERMANENT DELETE
  async permanentDelete(id: string): Promise<IUser> {
    const user = await this.Users.findByIdAndDelete(id);

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async buySubscription(
    user: IUser,
    buySubscriptionDto: { packageId: string },
  ) {
    if (!buySubscriptionDto.packageId)
      throw new NotFoundException('Package ID is required');

    if (user.subscription?.status === 'active')
      throw new NotFoundException('User already has an active subscription');

    const pkg = await this.subscriptionPackagesService.findOneHelper({
      _id: buySubscriptionDto.packageId,
    });
    if (!pkg) throw new NotFoundException('Package not found');

    const transaction = await this.transactionsService.create({
      user: user._id.toString(),
      package: pkg._id.toString(),
      amount: pkg.price,
      transactionId: `TXN-${Date.now()}`,
      status: 'success',
      type: 'subscription-purchase',
    });

    await Promise.all([
      this.notificationService.createNotification({
        senderMode: SENDER_MODE.USER,
        from: user._id,
        to: 'admin',
        title: 'New Subscription Purchase',
        message: `${user.name} has purchased the ${pkg.name} subscription package.`,
        flag: FLAG.USER,
        payload: {
          userId: user._id.toString(),
        },
      }),
      this.notificationService.createNotification({
        senderMode: SENDER_MODE.ADMIN,
        from: 'admin',
        to: user._id,
        title: 'Subscription Activated!',
        message: `Your subscription to the ${pkg.name} package has been activated. You have ${pkg.totalAnalysis} analyses available.`,
        flag: FLAG.SUBSCRIPTION,
        payload: {
          userId: user._id.toString(),
        },
      }),
      this.notificationService.createNotification({
        senderMode: SENDER_MODE.USER,
        from: user._id,
        to: 'admin',
        title: 'New Transaction!',
        message: `${user.name} has made a new transaction of amount ${pkg.price}.`,
        flag: FLAG.TRANSACTION,
        payload: {
          transactionId: transaction._id.toString(),
        },
      }),
    ]);

    return await this.Users.findByIdAndUpdate(
      user._id,
      {
        subscription: {
          package: pkg._id,
          status: 'active',
          stripeSubscriptionId: 'abc_10006265765',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            new Date().setMonth(new Date().getMonth() + 1),
          ),
          analysisCount: pkg.totalAnalysis,
        },
      },
      { new: true },
    );
  }

  //----------------- HELPER FUNCTIONS ----------------//

  /**
   * Retrieves the count of documents in the users collection that match the given filter.
   *
   * @param {object} filter A MongoDB filter object.
   * @returns {Promise<number>} A promise that resolves to the count of documents that match the filter.
   */
  async countHelper(filter: object): Promise<number> {
    return this.Users.countDocuments(filter);
  }

  /**
   * Retrieves a user with the role of ADMIN.
   *
   * @returns {Promise<IUser>} A promise that resolves to the user with the ADMIN role, or null if not found.
   */
  async getAdminHelper(): Promise<IUser> {
    return await this.Users.findOne({ role: ROLE.ADMIN });
  }

  /**
   * Retrieves a user from the database that matches the given filter.
   *
   * @param {object} filter A MongoDB filter object.
   * @returns {Promise<IUser>} A promise that resolves to the user if found, or null if not found.
   */
  async findOneHelper(filter: object, select?: object): Promise<IUser> {
    return await this.Users.findOne(filter, select);
  }

  async aggregateHelper(pipeline: PipelineStage[]): Promise<any> {
    return this.Users.aggregate(pipeline);
  }

  async createOneHelper(object: object): Promise<IUser> {
    return await this.Users.create(object);
  }

  async updateOneHelper(
    filter: object,
    update: object,
    opt?: object,
  ): Promise<IUser> {
    return await this.Users.findOneAndUpdate(filter, update, {
      new: true,
      ...opt,
    });
  }
}
