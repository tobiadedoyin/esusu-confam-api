import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupsService } from './group.service';
import { DrizzleModule } from '../../drizzle/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [GroupController],
  providers: [GroupsService],
})
export class GroupsModule {}
