// group.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { groups } from '../../drizzle/schema/groups.schema';
import { members } from '../../drizzle/schema/members.schema';
import { DRIZZLE } from '../../drizzle/drizzle.module';
import { DrizzleDB } from '../../drizzle/types/drizzle';
import { eq, count } from 'drizzle-orm';
import { users } from '@/drizzle/schema/users.schema';

@Injectable()
export class GroupsService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async generateCode() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await this.db.query.groups.findFirst({
      where: eq(groups.inviteCode, code.toString()),
    });

    if (existing) {
      return this.generateCode();
    }

    return code;
  }

  async createGroup(dto: CreateGroupDto, userId: string) {
    const existingGroup = await this.db.query.groups.findFirst({
      where: eq(groups.name, dto.name),
    });

    if (existingGroup) {
      throw new BadRequestException('A group with this name already exists');
    }

    const code = dto.isPublic ? '-' : await this.generateCode();

    // Insert into groups tables
    const [group] = await this.db
      .insert(groups)
      .values({
        name: dto.name,
        description: dto.description,
        maxCapacity: dto.maxCapacity,
        isPublic: dto.isPublic,
        adminId: userId,
        inviteCode: code,
      })
      .returning();

    // Add creator as group admin in members table
    await this.db.insert(members).values({
      groupId: group.id,
      userId,
      isAdmin: true,
      status: 'approved',
      joinedAt: new Date(),
    });

    return group;
  }

  async searchPublicGroups(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Fetch paginated groups
    const groupsList = await this.db
      .select({
        id: groups.id,
        name: groups.name,
      })
      .from(groups)
      .where(eq(groups.isPublic, true))
      .limit(limit)
      .offset(offset)
      .execute();

    // Count total matching groups
    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(groups)
      .where(eq(groups.isPublic, true))
      .execute();

    return {
      groupsList,
      total: total.toString(),
      page,
      limit,
    };
  }

  async requestJoin(groupId: string, userId: string) {
    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });
    if (!group) throw new NotFoundException('Group not found');

    if (!group.isPublic)
      throw new ForbiddenException(
        'Cannot join private group without invite code',
      );

    const [existing] = await this.db
      .select()
      .from(members)
      .where(eq(members.userId, userId));

    if (existing)
      throw new BadRequestException('User already belongs to a group');

    const groupMembers = await this.db
      .select()
      .from(members)
      .where(eq(members.groupId, groupId));

    if (groupMembers.length >= group.maxCapacity)
      throw new BadRequestException('Group has reached maximum capacity');

    await this.db.insert(members).values({
      groupId,
      userId,
      status: 'pending',
      isAdmin: false,
      joinedAt: new Date(),
    });

    return {
      message: 'Request to join group sent successfully',
      groupId,
    };
  }

  async joinWithCode(code: string, userId: string) {
    const group = await this.db.query.groups.findFirst({
      where: eq(groups.inviteCode, code),
    });

    if (!group || group.isPublic)
      throw new NotFoundException('Invalid invite code');

    const [existing] = await this.db
      .select()
      .from(members)
      .where(eq(members.userId, userId));

    if (existing)
      throw new BadRequestException('User already belongs to a group');

    const groupMembers = await this.db
      .select()
      .from(members)
      .where(eq(members.groupId, group.id));

    if (groupMembers.length >= group.maxCapacity)
      throw new BadRequestException('Group has reached maximum capacity');

    await this.db.insert(members).values({
      groupId: group.id,
      userId,
      status: 'approved',
      isAdmin: false,
      joinedAt: new Date(),
    });

    return {
      message: 'Joined group successfully',
      groupId: group.id,
    };
  }

  async getMembers(groupId: string, userId: string) {
    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) throw new NotFoundException('Group not found');
    if (group.adminId !== userId) throw new ForbiddenException('Access denied');

    const memberList = await this.db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        member_id: members.id,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.groupId, groupId))
      .execute();

    return {
      groupName: group.name,
      members: memberList,
    };
  }

  async updateMemberStatus(
    memberId: string,
    action: 'approve' | 'reject',
    adminId: string,
  ) {
    const member = await this.db.query.members.findFirst({
      where: eq(members.id, memberId),
    });
    if (!member) throw new NotFoundException('Member not found');

    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, member.groupId),
    });

    if (!group || group.adminId !== adminId)
      throw new ForbiddenException('You are not the admin of this group');

    if (action === 'approve') {
      const groupMembers = await this.db
        .select()
        .from(members)
        .where(eq(members.groupId, group.id));

      if (groupMembers.length >= group.maxCapacity)
        throw new BadRequestException('Group is full');

      await this.db
        .update(members)
        .set({ status: 'approved' })
        .where(eq(members.id, memberId));
    } else {
      await this.db.delete(members).where(eq(members.id, memberId));
    }
    return {
      message: action === 'approve' ? `Member approved` : 'Member rejected',
    };
  }

  async removeMember(memberId: string, adminId: string) {
    const member = await this.db.query.members.findFirst({
      where: eq(members.id, memberId),
    });
    if (!member) throw new NotFoundException('Member not found');

    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, member.groupId),
    });
    if (!group || group.adminId !== adminId)
      throw new ForbiddenException('Only admin can remove members');

    await this.db.delete(members).where(eq(members.id, memberId));

    return {
      message: 'Member removed successfully',
    };
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async isUserAdminOfGroup(userId: string): Promise<boolean> {
    const member = await this.db.query.members.findFirst({
      where: (m, { and, eq }) => and(eq(m.userId, userId), eq(m.isAdmin, true)),
    });

    return !!member;
  }

  // async isUserAdminOfGroup(userId: string, groupId?: string): Promise<boolean> {
  //   const whereClause = groupId
  //     ? (m, { and, eq }) =>
  //         and(eq(m.userId, userId), eq(m.groupId, groupId), eq(m.isAdmin, true))
  //     : (m, { and, eq }) => and(eq(m.userId, userId), eq(m.isAdmin, true));

  //   const member = await this.db.query.members.findFirst({
  //     where: whereClause,
  //   });

  //   return !!member;
  // }
}
