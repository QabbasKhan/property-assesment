import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { sign } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { generateOtpCode, generateSlug } from 'src/common/utils/helper.util';
import { ConfigService } from 'src/config/config.service';
import { NotificationsService } from 'src/modules/sockets/notifications/notifications.service';
import { EmailService } from 'src/shared/email.service';
import { ErrorLogService } from 'src/shared/error-log.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { SignupDto } from '../dto/signup.dto';
import { IOtp, Otp } from '../entities/otp.entity';
import { IUser, User } from '../entities/user.entity';
import { ROLE, STATUS } from '../enums/user.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly Users: Model<IUser>,
    @InjectModel(Otp.name) private readonly Otps: Model<IOtp>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly logger: ErrorLogService,
  ) {}

  signToken(id: string) {
    return sign({ id }, this.configService.get('JWT_SECRET'), {
      expiresIn: this.configService.get('JWT_EXPIRES_IN') as any,
    });
  }

  createSendToken(user: IUser) {
    const token = this.signToken(user.id);

    user.password = undefined;

    return { token, user };
  }

  async signup(signupDto: SignupDto) {
    const { email, name } = signupDto;

    const existingUser = await this.Users.findOne({ email });
    if (existingUser) throw new BadRequestException('User Already Exist');

    signupDto.role = ROLE.PARENT;
    signupDto.status = STATUS.ACTIVE;
    signupDto.slug = generateSlug(name);

    const user = await this.Users.create(signupDto);

    const code = generateOtpCode();
    await this.Otps.create({ email, code });

    try {
      await this.emailService.sendSignupEmail(
        {
          email: user.email,
          firstName: user.name,
        },
        {
          code: code,
        },
      );
    } catch (error) {
      this.logger.logError(
        error.message,
        'Error while sending email on signup',
        error.stack,
      );
    }

    const token = this.signToken(user.id);

    user.password = undefined;

    return { token, user };
    // return { message: 'Otp code has been send to your email' };
  }

  async login(
    loginUserDto: LoginDto,
  ): Promise<{ token: string; user: IUser } | { message: string }> {
    const { email, password } = loginUserDto;

    const user = await this.Users.findOne({
      email,
    }).select('+password');

    console.log(user);

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new BadRequestException('Invalid login credentials');

    if (user.status === STATUS.INACTIVE)
      throw new BadRequestException('User is not active!');

    // if (user.status === STATUS.PENDING_VERIFICATION) {
    //   await this.Otps.findOneAndDelete({ email });

    //   const code = generateOtpCode();
    //   await this.Otps.create({ email, code });

    //   try {
    //     await this.emailService.sendSignupEmail(
    //       {
    //         email: user.email,
    //         firstName: user.name,
    //       },
    //       {
    //         code: code,
    //       },
    //     );
    //   } catch (error) {
    //     this.logger.logError(
    //       error.message,
    //       'Error while sending email on signup',
    //       error.stack,
    //     );
    //   }

    //   return { message: 'Otp code has been send to your email' };
    // }

    if ([ROLE.SUPER_ADMIN].includes(user.role))
      throw new BadRequestException('You are not allowed to login here');

    const token = this.signToken(user.id);

    user.password = undefined;

    return { token, user };
  }

  async validateOtp(validateOtpDto: SendOtpDto) {
    const { code, email } = validateOtpDto;

    const [user, otp] = await Promise.all([
      this.Users.findOne({ email }),
      this.Otps.findOne({ email }),
    ]);

    if (!user) throw new BadRequestException('No user found');
    if (!otp) {
      throw new BadRequestException('OTP code has expired.');
    }

    if (code !== otp?.code)
      throw new BadRequestException('You have entered wrong Otp Code.');

    const [updatedUser] = await Promise.all([
      this.Users.findByIdAndUpdate(user._id, { status: STATUS.ACTIVE }),
      this.Otps.findByIdAndDelete(otp._id),
    ]);

    return this.createSendToken(updatedUser);
  }

  async adminLogin(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user: IUser = await this.Users.findOne({
      email,
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new BadRequestException('Invalid login credentials');

    if (![ROLE.SUPER_ADMIN].includes(user.role))
      throw new BadRequestException('Not a user route');

    return this.createSendToken(user);
  }

  async forgotPassword(createOtpDto: SendOtpDto) {
    const { email } = createOtpDto;

    const user: IUser = await this.Users.findOne({ email });
    if (!user) throw new BadRequestException('No user found');

    const existingOtp = await this.Otps.findOne({ email });
    if (existingOtp)
      throw new BadRequestException(
        'You must wait 20 seconds before making another request!',
      );

    createOtpDto.code = generateOtpCode();

    await this.Otps.create(createOtpDto);

    try {
      await this.emailService.sendForgotPassword(
        {
          email: user.email,
          firstName: user.name,
        },
        { code: createOtpDto.code },
      );
    } catch (error) {
      this.logger.logError(error.message, 'Forgot Password', error.stack);
      throw new BadRequestException('failed to send otp code');
    }

    return { message: 'Otp code has been send on your email' };
  }

  async verifyOtp(verifyOtpDto: SendOtpDto) {
    const { code, email } = verifyOtpDto;

    const user: IUser = await this.Users.findOne({ email });
    if (!user) throw new BadRequestException('No user found');

    const otp: IOtp = await this.Otps.findOne({ email });
    if (!otp) {
      throw new BadRequestException('OTP code has expired.');
    }

    if (code !== otp?.code)
      throw new BadRequestException('You have entered wrong Otp Code.');

    return { message: 'OTP verified successfully' };
  }

  async resendOtp(createOtpDto: SendOtpDto) {
    const { email } = createOtpDto;

    const user: IUser = await this.Users.findOne({ email });
    if (!user) throw new BadRequestException('No user found');

    createOtpDto.code = generateOtpCode();

    const existingOtp = await this.Otps.findOne({ email });
    if (existingOtp) {
      await this.Otps.findByIdAndUpdate(existingOtp._id, {
        code: createOtpDto.code,
      });
    } else {
      await this.Otps.create(createOtpDto);
    }

    try {
      await this.emailService.sendOtpResend(
        {
          email: user.email,
          firstName: user.name,
        },
        { code: createOtpDto.code },
      );
    } catch (error) {
      this.logger.logError(
        error.message,
        'Error while sending email on resend otp',
        error.stack,
      );
      throw new BadRequestException('Failed to send email');
    }

    return { message: 'Otps code has been send to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { code, email, password } = resetPasswordDto;

    const user: IUser = await this.Users.findOne({ email }).select('+password');
    if (!user) throw new BadRequestException('No user found');

    await this.verifyOtp({ code, email });

    user.password = password;

    await user.save();

    return { message: 'Password reset successfully' };
  }

  async changePassword(user: IUser, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, password, confirmPassword } = changePasswordDto;

    if (confirmPassword !== password)
      throw new BadRequestException('Confirm password does not match');

    if (currentPassword === password)
      throw new BadRequestException(
        'New password cannot be same as current password',
      );

    const userCheck: IUser = await this.Users.findOne({
      _id: user?._id,
    }).select('+password');

    const passwordCheck = await user.correctPassword(
      currentPassword,
      userCheck.password,
    );
    if (!passwordCheck) throw new BadRequestException('Wrong current password');

    userCheck.password = password;

    await userCheck.save();

    return this.createSendToken(userCheck);
  }

  // ------------------ HELPERS --------------------------- //

  async getAdminHelper(): Promise<IUser> {
    return await this.Users.findOne({ role: 'admin' });
  }
}
