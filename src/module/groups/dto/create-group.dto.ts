// dto/create-group.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  maxCapacity: number;

  @IsBoolean()
  isPublic: boolean;
}
