import { IsEmail, IsNotEmpty, MinLength, IsString, Length } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class VerifyResetCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
