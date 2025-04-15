import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './module/auth/auth.module';
import { GroupsModule } from './module/groups/group.module';
// import { UsersModule } from './module/users/user.module';
// import { MemberModule } from './member/member.module';
import { DrizzleModule } from './drizzle/drizzle.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    DrizzleModule,
    GroupsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
