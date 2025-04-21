import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from 'src/config/config.service';
import { IUser } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { STATUS } from '../enums/user.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<IUser> {
    const { id, iat } = payload;

    // fetching the user info.
    const user: IUser = await this.userService.findOneHelper({ _id: id });

    // 1) Check if user still exists
    if (!user)
      throw new UnauthorizedException(
        'The user belonging to this token does no longer exist.',
      );

    // 2) Check if user changed password after the token was issued
    if (user.changedPasswordAfter(iat))
      throw new UnauthorizedException(
        'User recently changed password! Please log in again.',
      );

    if (user.status === STATUS.INACTIVE)
      throw new UnauthorizedException('User is not active');

    return user;
  }
}
