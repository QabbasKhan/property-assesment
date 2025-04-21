import {
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

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly Users: Model<IUser>,
    private readonly configService: ConfigService,
    private readonly logger: ErrorLogService,
    private readonly emailService: EmailService,
  ) {}

  async getMe(user: IUser): Promise<IUser> {
    if (user.status !== STATUS.ACTIVE)
      throw new UnauthorizedException('User is not active');

    return user;
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
    return await this.Users.findOne({ role: ROLE.SUPER_ADMIN });
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
