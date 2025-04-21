import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Paginate } from 'src/common/decorators/pagination.decorator';
import { Pagination } from 'src/common/utils/types.util';
import { IUser } from 'src/modules/users/entities/user.entity';
import { SeenNotificationDto } from './dto/seen-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // ==================== GET ROUTES ==========================

  @Auth()
  @Get('/')
  async getNotifications(
    @GetUser() user: IUser,
    @Paginate() pagination: Pagination,
  ) {
    const data = await this.notificationService.getNotifications(
      user,
      pagination,
    );
    return { data };
  }

  @Auth()
  @Get('/unread-count')
  async getUnreadCount(@GetUser() user: IUser) {
    const data = await this.notificationService.getUnreadCount(user);
    return { data };
  }

  // ==================== PATCH ROUTES ==========================

  @Auth()
  @Patch('/seen')
  async seenNotifications(
    @GetUser() user: IUser,
    @Body()
    seenNotificationDto: SeenNotificationDto,
  ) {
    const { notificationId } = seenNotificationDto;

    const seenNotification = await this.notificationService.seenNotifications({
      user,
      notificationId,
    });

    return seenNotification;
  }
}
