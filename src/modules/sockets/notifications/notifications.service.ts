import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { Model, Types } from 'mongoose';
import { Pagination } from 'src/common/utils/types.util';
import { IUser } from 'src/modules/users/entities/user.entity';
import { ROLE } from 'src/modules/users/enums/user.enum';
import { UsersService } from 'src/modules/users/users.service';
import { FLAG, SENDER_MODE } from '../enums/notification.enum';
import { PrivateSocketsGateway } from '../private-sockets.gateway';
import { INotification, Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly Notifications: Model<INotification>,
    private readonly socket: PrivateSocketsGateway,
    private readonly userService: UsersService,
  ) {}

  async getNotifications(
    user: IUser,
    pagination: Pagination,
  ): Promise<{
    notifications: INotification[];
    unreadCount: number;
    totalCount: number;
  }> {
    const [totalCount, unreadCount, newNotifications] = await Promise.all([
      this.Notifications.countDocuments({
        receiver: user._id,
      }),

      this.Notifications.countDocuments({
        receiver: user._id,
        seen: false,
      }),

      this.Notifications.find({
        receiver: user._id,
      })
        .populate('sender', 'firstName lastName socketIds photo')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
    ]);

    return {
      notifications: (newNotifications as INotification[]) || [],
      unreadCount,
      totalCount,
    };
  }

  async getUnreadCount(user: IUser): Promise<{
    unreadCount: number;
  }> {
    const unreadCount = await this.Notifications.countDocuments({
      receiver: user._id,
      seen: false,
    });

    return {
      unreadCount,
    };
  }

  async seenNotifications(params: {
    user: IUser;
    notificationId?: string;
  }): Promise<{ notifications: INotification[]; unseenCount: number }> {
    const { user, notificationId } = params;

    const dbQuery = { receiver: user._id };
    if (!!notificationId) dbQuery['_id'] = notificationId;

    await this.Notifications.updateMany(dbQuery, { $set: { seen: true } });

    const [unseenCount, notifications] = await Promise.all([
      this.Notifications.countDocuments({
        receiver: user._id,
        seen: false,
      }),
      this.Notifications.find({ receiver: user._id, seen: true }).lean(),
    ]);

    return { notifications: notifications as INotification[], unseenCount };
  }

  // ==================== HELPER SERVICE ==========================

  /**
   * Sends a notification to the specified user. If the sender mode is `admin`, the
   * notification will be sent from the admin user. If the sender mode is `user`, the
   * notification will be sent from the specified user.
   *
   * @param notification The notification data to send.
   * @param notification.senderMode The sender mode of the notification.
   * @param notification.from The sender of the notification.
   * @param notification.to The receiver of the notification.
   * @param notification.title The title of the notification.
   * @param notification.message The message of the notification.
   * @param notification.flag The flag of the notification. If not provided, it will be
   * `FLAG.NONE`.
   * @param notification.payload The payload of the notification. If not provided, it will
   * be an empty object.
   */
  async createNotification(notification: {
    senderMode: SENDER_MODE;
    from: Types.ObjectId | 'admin';
    to: Types.ObjectId | 'admin';
    title: string;
    message: string;
    flag?: FLAG;
    payload?: object;
  }) {
    const { from, to } = notification;

    if (!notification.flag) {
      notification.flag = FLAG.NONE;
      notification.payload = {};
    }

    if (from === 'admin') {
      const admin = await this.userService.findOneHelper(
        { role: ROLE.ADMIN },
        { _id: 1 },
      );
      notification.from = admin._id;
    }

    const toUser =
      to === 'admin'
        ? await this.userService.findOneHelper(
            { role: ROLE.ADMIN },
            { _id: 1, socketIds: 1, fcmTokens: 1 },
          )
        : await this.userService.findOneHelper(
            { _id: to },
            { _id: 1, socketIds: 1, fcmTokens: 1 },
          );

    if (from.toString() === toUser._id.toString()) return;

    await this.Notifications.create({
      ...notification,
      sender: from,
      receiver: toUser._id,
      createdAt: moment().utc().toDate(),
    });

    const unreadCount = await this.Notifications.countDocuments({
      receiver: toUser._id,
      seen: false,
    });

    this.socket.server
      .to(toUser.socketIds)
      .emit('new-notification', unreadCount);
    return;
  }

  // ==================== PUSH NOTIFICATION SERVICE ==========================

  // async sendPushNotification(notification: notification): Promise<void> {
  //   const { title, message, fcmToken, receiverUser } = notification;

  //   if (fcmToken?.length > 0 && receiverUser?.pushNotifications) {
  //     const imageUrl = `${this.configService.get(
  //       'API_HOSTED_URL',
  //     )}images/logo.png`;

  //     admin
  //       .messaging()
  //       .sendEachForMulticast({
  //         notification: {
  //           title: title || 'Next Generation',
  //           body: message,
  //           imageUrl,
  //         },
  //         tokens: fcmToken,
  //       })
  //       .then(() => console.log('notification sent!'));
  //   }
  // }
}
