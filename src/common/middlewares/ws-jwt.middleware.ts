import { red } from 'cli-color';
import { JwtPayload, Secret, verify } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { ConfigService } from 'src/config/config.service';
import { JwtStrategy } from 'src/modules/users/auth/jwt.strategy';
import { UsersService } from 'src/modules/users/users.service';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const WsJwtMiddleware = (
  configService: ConfigService,
  userService: UsersService,
): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake?.headers?.authorization ||
        socket.handshake?.auth?.token;

      if (!token) {
        throw new Error('Authorization token is missing');
      }

      let payload: JwtPayload | null = null;
      let secret: Secret = configService.get('JWT_SECRET');

      try {
        payload = verify(token, secret) as JwtPayload;
      } catch (error) {
        throw new Error('Authorization token is invalid');
      }

      const strategy = new JwtStrategy(configService, userService);
      const user = await strategy.validate(payload);

      if (!user) {
        throw new Error('User not found');
      }

      socket = Object.assign(socket, {
        user: user!,
      });

      next();
    } catch (error) {
      console.log(red(`Socket Connection Error: ${error.message}`));
      next(error);
    }
  };
};
