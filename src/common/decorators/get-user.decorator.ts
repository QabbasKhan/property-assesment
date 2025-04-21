import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Socket } from 'socket.io-client';
import { IUser } from 'src/modules/users/entities/user.entity';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): IUser => {
    const req: Request = ctx.switchToHttp().getRequest();

    return req.user as IUser;
  },
);

export const GetWsUser = createParamDecorator(
  (_data, ctx: ExecutionContext): IUser => {
    const socket = ctx.switchToWs().getClient<Socket>();

    return socket['user'] as IUser;
  },
);
