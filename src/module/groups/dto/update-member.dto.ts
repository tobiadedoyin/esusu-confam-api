import { IsIn } from 'class-validator';

export class UpdateMemberStatusDto {
  @IsIn(['approve', 'reject'], {
    message: 'Action must be either "approve" or "reject"',
  })
  status: 'approve' | 'reject';
}
