import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { eq, or } from 'drizzle-orm';
import { users } from '../../drizzle/schema/users.schema';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { DrizzleDB } from '@/drizzle/types/drizzle';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 10);

    const existing = await this.db
      .select()
      .from(users)
      .where(or(eq(users.email, dto.email), eq(users.phone, dto.phone)));

    if (existing.length > 0) {
      throw new ConflictException('User already exists');
    }

    const [user] = await this.db
      .insert(users)
      .values({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        password: hashed,
      })
      .returning();

    const payload: JwtPayload = { id: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const response = {
      name: `${user.firstName} ${user.lastName}`,
      email: `${user.email}`,
      phone: `${user.phone}`,
      accessToken,
    };

    return { response };
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email));
    if (!user) throw new BadRequestException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new BadRequestException('Incorrect password');

    const payload: JwtPayload = { id: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const response = {
      name: `${user.firstName} ${user.lastName}`,
      accessToken,
    };

    return { response };
  }

  async findOne(email: string): Promise<any> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user;
  }
}
