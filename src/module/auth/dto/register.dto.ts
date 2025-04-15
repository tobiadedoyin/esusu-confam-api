import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be a minimum of 3 characters' })
  firstName: string;

  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be a minimum of 3 characters' })
  lastName: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Enter a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'phone number cannot be empty' })
  phone: string;

  @MinLength(8, { message: 'password must be a minimun of 8 characters' })
  password: string;
}
