// group.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { GroupsService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateMemberStatusDto } from './dto/update-member.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { IsGroupAdminGuard } from '@/common/guards/is-group-admin.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupsService) {}

  @Post()
  async createGroup(@Body() dto: CreateGroupDto, @Req() req) {
    const userId = req.user.id;
    const group = await this.groupService.createGroup(dto, userId);
    return {
      message: 'Group created successfully',
      data: group,
    };
  }

  @Get('search')
  searchGroups(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.groupService.searchPublicGroups(Number(page), Number(limit));
  }

  @Post(':id/join')
  requestToJoinGroup(@Param('id') groupId: string, @Req() req) {
    const userId = req.user.id;
    return this.groupService.requestJoin(groupId, userId);
  }

  @Post('join-by-code')
  joinWithInviteCode(@Body() dto: JoinGroupDto, @Req() req) {
    const userId = req.user.id;
    return this.groupService.joinWithCode(dto.code, userId);
  }

  @UseGuards(JwtAuthGuard, IsGroupAdminGuard)
  @Get(':id/members')
  viewGroupMembers(@Param('id') groupId: string, @Req() req) {
    const userId = req.user.id;
    return this.groupService.getMembers(groupId, userId);
  }

  @UseGuards(JwtAuthGuard, IsGroupAdminGuard)
  @Patch('members/:id/status')
  updateMemberStatus(
    @Param('id') memberId: string,
    @Body() dto: UpdateMemberStatusDto,
    @Req() req,
  ) {
    const adminId = req.user.id;
    console.log(' admin id', adminId);
    return this.groupService.updateMemberStatus(memberId, dto.status, adminId);
  }

  @UseGuards(JwtAuthGuard, IsGroupAdminGuard)
  @Delete('members/:id')
  removeMember(@Param('id') memberId: string, @Req() req) {
    const adminId = req.user.id;
    return this.groupService.removeMember(memberId, adminId);
  }
}
