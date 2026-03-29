import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { EmailService } from 'src/shared/email.service';
import { ErrorLogService } from 'src/shared/error-log.service';
import { IUser, User } from './entities/user.entity';
import { ROLE, STATUS, SUBSCRIPTION_STATUS } from './enums/user.enum';
import { Pagination } from 'src/common/utils/types.util';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/create-user.dto';
import { SubscriptionPackagesService } from './subscription-packages/subscription-packages.service';
import { NotificationsService } from '../sockets/notifications/notifications.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FLAG } from '../sockets/enums/notification.enum';
import { SENDER_MODE } from '../sockets/enums/notification.enum';
import { StripeService } from 'src/shared/stripe.service';
import { Request } from 'express';
import Stripe from 'stripe';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly Users: Model<IUser>,
    private readonly subscriptionPackagesService: SubscriptionPackagesService,
    private readonly emailService: EmailService,
    private readonly transactionsService: TransactionsService,
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationService: NotificationsService,
    private readonly configService: ConfigService,
    // private readonly socket: PrivateSocketsGateway,
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

  // async buySubscription(
  //   user: IUser,
  //   buySubscriptionDto: { packageId: string },
  // ) {
  //   if (!buySubscriptionDto.packageId)
  //     throw new NotFoundException('Package ID is required');

  //   if (user.subscription?.status === 'active')
  //     throw new NotFoundException('User already has an active subscription');

  //   const pkg = await this.subscriptionPackagesService.findOneHelper({
  //     _id: buySubscriptionDto.packageId,
  //   });
  //   if (!pkg) throw new NotFoundException('Package not found');

  //   const transaction = await this.transactionsService.create({
  //     user: user._id.toString(),
  //     package: pkg._id.toString(),
  //     amount: pkg.price,
  //     transactionId: `TXN-${Date.now()}`,
  //     status: 'success',
  //     type: 'subscription-purchase',
  //   });

  //   await Promise.all([
  //     this.notificationService.createNotification({
  //       senderMode: SENDER_MODE.USER,
  //       from: user._id,
  //       to: 'admin',
  //       title: 'New Subscription Purchase',
  //       message: `${user.name} has purchased the ${pkg.name} subscription package.`,
  //       flag: FLAG.USER,
  //       payload: {
  //         userId: user._id.toString(),
  //       },
  //     }),
  //     this.notificationService.createNotification({
  //       senderMode: SENDER_MODE.ADMIN,
  //       from: 'admin',
  //       to: user._id,
  //       title: 'Subscription Activated!',
  //       message: `Your subscription to the ${pkg.name} package has been activated. You have ${pkg.totalAnalysis} analyses available.`,
  //       flag: FLAG.SUBSCRIPTION,
  //       payload: {
  //         userId: user._id.toString(),
  //       },
  //     }),
  //     this.notificationService.createNotification({
  //       senderMode: SENDER_MODE.USER,
  //       from: user._id,
  //       to: 'admin',
  //       title: 'New Transaction!',
  //       message: `${user.name} has made a new transaction of amount ${pkg.price}.`,
  //       flag: FLAG.TRANSACTION,
  //       payload: {
  //         transactionId: transaction._id.toString(),
  //       },
  //     }),
  //   ]);

  //   return await this.Users.findByIdAndUpdate(
  //     user._id,
  //     {
  //       subscription: {
  //         package: pkg._id,
  //         status: 'active',
  //         stripeSubscriptionId: 'abc_10006265765',
  //         currentPeriodStart: new Date(),
  //         currentPeriodEnd: new Date(
  //           new Date().setMonth(new Date().getMonth() + 1),
  //         ),
  //         analysisCount: pkg.totalAnalysis,
  //       },
  //     },
  //     { new: true },
  //   );
  // }s

  async buySubscription(
    user: IUser,
    buySubscriptionDto: { packageId: string },
  ) {
    const { packageId } = buySubscriptionDto;

    if (!packageId) {
      throw new BadRequestException('Package Id is required.');
    }

    const subscriptionPackage =
      await this.subscriptionPackagesService.findOneHelper({ _id: packageId });

    if (!subscriptionPackage)
      throw new BadRequestException('No Package found with that Id.');

    if (
      user.subscription &&
      user.subscription?.status === SUBSCRIPTION_STATUS.ACTIVE
    ) {
      throw new BadRequestException('You already have an active subscription.');
    }

    const [error, checkoutSession] =
      await this.stripeService.createCheckoutSession({
        mode: 'subscription',

        customer: user.stripeCustomerId,
        lineItems: [
          {
            price: subscriptionPackage.stripePriceId,
            quantity: 1,
          },
        ],
        metadata: {
          type: subscriptionPackage.type,
          packageId: subscriptionPackage._id.toString(),
          priceId: subscriptionPackage.stripePriceId,
        },
        isTrial: false,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { url: checkoutSession.url };
  }

  async renewSubscription(user: IUser) {
    if (!user.subscription) {
      throw new BadRequestException('You do not have a subscription.');
    }

    const isCanceled =
      user.subscription?.status === SUBSCRIPTION_STATUS.CANCELED ||
      (user.subscription?.status === SUBSCRIPTION_STATUS.ACTIVE &&
        user.subscription?.cancelAtPeriodEnd === true);

    if (!isCanceled) {
      throw new BadRequestException(
        'You do not have a cancelled subscription.',
      );
    }

    const [error, renewedSubscription] =
      await this.stripeService.renewSubscription(
        user.subscription.subscriptionId,
      );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return renewedSubscription;
  }

  async cancelSubscription(user: IUser) {
    if (
      !user.subscription ||
      (user.subscription?.status !== SUBSCRIPTION_STATUS.ACTIVE &&
        user.subscription?.status !== SUBSCRIPTION_STATUS.TRIALING)
    ) {
      throw new BadRequestException('You do not have an active subscription.');
    }

    const [error, cancelledSubscription] =
      await this.stripeService.cancelSubscription(
        user.subscription.subscriptionId,
      );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return cancelledSubscription;
  }

  async updateSubscription(user: IUser, packageId: string) {
    if (!packageId) {
      throw new BadRequestException('Package Id is required.');
    }

    const subscriptionPackage =
      await this.subscriptionPackagesService.findOneHelper({ _id: packageId });

    if (!subscriptionPackage)
      throw new BadRequestException('No Package found with that Id.');

    if (
      ![SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING].includes(
        user.subscription.status,
      )
    ) {
      throw new BadRequestException('You do not have an active subscription.');
    }

    if (user.subscription.package === packageId) {
      throw new BadRequestException('You are already on this tier.');
    }

    const [error, updatedSubscription] =
      await this.stripeService.updateSubscription({
        subscriptionId: user.subscription.subscriptionId,
        priceId: subscriptionPackage.stripePriceId,
        packageId: packageId,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return updatedSubscription;
  }

  //----------------- WEBHOOK HANDLERS ----------------//
  async stripeWebhook(req: Request) {
    const [err, event] = await this.stripeService.constructEvent(
      req,
      this.configService.get('STRIPE_WEBHOOK_SECRET'),
    );

    if (err) {
      throw new BadRequestException(err.message);
    }

    const dataObject = event.data.object;
    console.log(`Stripe webhook received: ${event.type},`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = dataObject as Stripe.Checkout.Session;
        if (session.status === 'complete') {
          const user = await this.Users.findOne({
            stripeCustomerId: session.customer,
          });

          if (!user) {
            return null;
          }

          let pdfUrl = null;

          switch (session?.mode) {
            case 'subscription': {
              const [err1, invoice] = await this.stripeService.getInvoice(
                session.invoice as string,
              );
              if (err1) {
                console.log(err1.message);
              }
              pdfUrl = invoice?.hosted_invoice_url || null;
              // const transaction = await this.transactionsService.create({
              //   user: user._id,
              //   amount: session.amount_total / 100,
              //   type: session.metadata.type as TRANSACTION_TYPE,
              //   package: session.metadata.packageId || null,
              //   indicator: session.metadata.indicatorId || null,
              //   pdfUrl,
              //   accessCode: randomIdGenerator(),
              // });

              await this.transactionsService.create({
                user: user._id.toString(),
                amount: session.amount_total / 100,
                package: session.metadata.packageId || null,
                transactionId: `TXN-${Date.now()}`,
                status: 'success',
                type: 'subscription-purchase',
                // pdfUrl
              });

              const subscriptionPackage =
                await this.subscriptionPackagesService.findOneHelper({
                  _id: session.metadata.packageId,
                });
              if (!subscriptionPackage) {
                console.log(
                  `No Subscription Package found with that Id: ${session.metadata.packageId},`,
                );
              }
              // await this.emailService.sendSubscriptionPurchase(user, {
              //   accessCode: transaction.accessCode,
              //   packageName: subscriptionPackage.name,
              // });

              // user.hasDiscordAccess = true;
              await user.save();

              // if (user.socketIds.length > 0) {
              //   PrivateSocketRef.getServer()
              //     .to(user.socketIds)
              //     .emit('user-updated', { user });
              // }

              return null;
            }
            case 'payment': {
              // const [err1, paymentIntent] =
              //   await this.stripeService.getPaymentIntent(
              //     session.payment_intent as string,
              //   );
              // if (err1) {
              //   this.logService.logError(err1.message, 'getPaymentIntent');
              // }
              // pdfUrl =
              //   (paymentIntent?.latest_charge as Stripe.Charge)?.receipt_url ||
              //   null;

              // const transaction = await this.transactionsService.create({
              //   user: user._id,
              //   amount: session.amount_total / 100,
              //   type: session.metadata.type as TRANSACTION_TYPE,
              //   package: session.metadata.packageId || null,
              //   indicator: session.metadata.indicatorId || null,
              //   pdfUrl,
              //   accessCode: randomIdGenerator(),
              // });

              // if (session.metadata.type === TRANSACTION_TYPE.INDICATOR) {
              //   user.indicators.push(
              //     new Types.ObjectId(session.metadata.indicatorId),
              //   );
              //   const indicatorPackage =
              //     await this.indicatorPackagesService.findOneHelper({
              //       _id: session.metadata.indicatorId,
              //     });
              //   if (!indicatorPackage) {
              //     this.logService.logError(
              //       No Indicator found with that Id: ${ session.metadata.indicatorId },
              //     'stripeWebhook',
              //     );
              //   }
              //   await this.emailService.sendAccessCode(user, {
              //     accessCode: transaction.accessCode,
              //     indicatorName:
              //       indicatorPackage?.name || '[Your Indicator Name]',
              //   });
              // } else if (session.metadata.type === TRANSACTION_TYPE.ONE_TIME) {
              //   const oneTimePackage =
              //     await this.subscriptionPackageService.findOneHelper({
              //       _id: session.metadata.packageId,
              //     });
              //   await this.emailService.sendSubscriptionPurchase(user, {
              //     accessCode: transaction.accessCode,
              //     packageName: oneTimePackage?.name,
              //   });
              // }

              // user.hasDiscordAccess = true;
              // await user.save();

              // if (user.socketIds.length > 0) {
              //   PrivateSocketRef.getServer()
              //     .to(user.socketIds)
              //     .emit('user-updated', { user });
              // }

              return null;
            }
            case 'setup': {
              const [err2, defaultCard] =
                await this.stripeService.getDefaultCard(
                  session.customer as string,
                );

              if (err2) {
                console.log('Error while setup in stripe webhook');
                throw new BadRequestException(err2.message);
              }

              if (!defaultCard) {
                const [err3, setupIntent] =
                  await this.stripeService.getSetupIntent(
                    session.setup_intent as string,
                  );

                if (err3) {
                  console.log('Error while setup in stripe webhook');

                  throw new BadRequestException(err3.message);
                }

                if (setupIntent.status === 'succeeded') {
                  const [err4] = await this.stripeService.setDefaultCard(
                    setupIntent.payment_method as string,
                    session.customer as string,
                  );

                  if (err4) {
                    console.log('Error while setup in stripe webhook');

                    throw new BadRequestException(err4.message);
                  }

                  return {
                    message: 'Default card set successfully',
                  };
                }
              }

              return null;
            }
            default:
              console.log('Invalid Session Stripe Checkout');

              return null;
          }
        }

        return null;
      }

      case 'customer.subscription.created': {
        const subscription = dataObject as Stripe.Subscription;

        const user = await this.updateOneHelper(
          { stripeCustomerId: subscription.customer as string },
          {
            subscription: {
              subscriptionId: subscription.id,
              package: subscription.items.data[0].price.metadata.packageId,
              currentPeriodStart: new Date(
                subscription.items.data[0].current_period_start * 1000,
              ),
              currentPeriodEnd: new Date(
                subscription.items.data[0].current_period_end * 1000,
              ),
              status: subscription.status as SUBSCRIPTION_STATUS,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          },
        );

        await user.populate([{ path: 'subscription.package' }]);

        // if (user.socketIds.length > 0) {
        //   PrivateSocketRef.getServer()
        //     .to(user.socketIds)
        //     .emit('user-updated', { user });
        // }

        return null;
      }

      case 'customer.subscription.updated': {
        console.log('customer.subscription.updated event received');

        const subscription = dataObject as Stripe.Subscription;

        const user = await this.updateOneHelper(
          { stripeCustomerId: subscription.customer as string },
          {
            subscription: {
              subscriptionId: subscription.id,
              package: subscription.items.data[0].price.metadata.packageId,
              priceId: subscription.items.data[0].price.id,
              currentPeriodStart: new Date(
                subscription.items.data[0].current_period_start * 1000,
              ),
              currentPeriodEnd: new Date(
                subscription.items.data[0].current_period_end * 1000,
              ),
              status: subscription.status as SUBSCRIPTION_STATUS,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          },
        );

        // await this.transactionsService.create({
        //   user: user._id,
        //   amount: subscription.items.data[0].price.unit_amount / 100,
        //   type: TRANSACTION_TYPE.SUBSCRIPTION,
        //   package: subscription.items.data[0].price.metadata.packageId,
        //   indicator: null,
        //   pdfUrl: null,
        // });

        await user.populate([{ path: 'subscription.package' }]);

        if (user.socketIds.length > 0) {
          // PrivateSocketRef.getServer()
          //   .to(user.socketIds)
          //   .emit('user-updated', { user });
        }

        return null;
      }

      case 'customer.subscription.deleted': {
        console.log('customer.subscription.deleted');
        const subscription = dataObject as Stripe.Subscription;

        const user = await this.updateOneHelper(
          { stripeCustomerId: subscription.customer as string },
          {
            subscription: {
              status: SUBSCRIPTION_STATUS.INACTIVE,
            },
          },
        );
        await user.populate([{ path: 'subscription.package' }]);

        // if (user.socketIds.length > 0) {
        //   PrivateSocketRef.getServer()
        //     .to(user.socketIds)
        //     .emit('user-updated', { user });
        // }

        return null;
      }
      default:
        throw new BadRequestException('Unhandled event type');
    }
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
