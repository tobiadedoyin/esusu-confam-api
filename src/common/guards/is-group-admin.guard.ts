import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupsService } from '../../module/groups/group.service';

@Injectable()
export class IsGroupAdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly groupsService: GroupsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    // Group ID might be from URL or body
    // const groupId =
    //   request.params.groupId || request.params.id || request.body.groupId;

    const isAdmin = await this.groupsService.isUserAdminOfGroup(
      userId,
      // groupId,
    );

    if (!isAdmin) {
      throw new ForbiddenException('You are not an admin of this group');
    }

    return true;
  }
}
