import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { Otp, OtpSchema } from './entities/otp.entity';
import { User, UserSchema } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SubscriptionPackagesController } from './subscription-packages/subscription-packages.controller';
import { SubscriptionPackagesService } from './subscription-packages/subscription-packages.service';
import {
  SubscriptionPackage,
  SubscriptionPackageSchema,
} from './subscription-packages/entities/subscription-package.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { SocketsModule } from '../sockets/sockets.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: SubscriptionPackage.name, schema: SubscriptionPackageSchema },
    ]),
    TransactionsModule,
    forwardRef(() => SocketsModule),
  ],
  controllers: [
    UsersController,
    AuthController,
    SubscriptionPackagesController,
  ],
  providers: [
    UsersService,
    SubscriptionPackagesService,
    AuthService,
    JwtStrategy,
  ],
  exports: [UsersService],
})
export class UsersModule {}
