import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUser } from 'src/modules/users/entities/user.entity';
import { matchValueInArray } from '../utils/helper.util';
import { ROLE } from 'src/modules/users/enums/user.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<ROLE[]>('roles', context.getHandler());

    if (!roles || !roles?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user: IUser = request.user;

    if (!user) return false;

    return matchValueInArray(roles, user.role);
  }
}
