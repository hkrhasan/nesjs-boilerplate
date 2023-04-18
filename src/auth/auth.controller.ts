import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, PhoneAuthDto, VerifyPhoneAuthDto } from './dto';
import { Tokens } from './types';
import { User, UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Public,
  Roles,
  GetCurrentUserId,
  RtGaurd,
  GetCurrentUser,
} from 'src/utils';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller({
  version: '1',
  path: 'auth',
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('/phone-auth')
  @HttpCode(HttpStatus.CREATED)
  phoneAuth(@Body() dto: PhoneAuthDto) {
    return this.authService.phoneAuth(dto);
  }

  @Public()
  @Post('/phone-auth/verification')
  @HttpCode(HttpStatus.ACCEPTED)
  verifyPhoneAuth(@Body() dto: VerifyPhoneAuthDto) {
    return this.authService.verifyPhoneAuth(dto);
  }

  @Public()
  @Post('/signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signin(dto);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: number): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @Get('/users')
  @HttpCode(HttpStatus.OK)
  allUser(@GetCurrentUserId() userId: number): Promise<User[]> {
    return this.authService.allUser(userId);
  }

  @Public()
  @Get('/email-verification/:token')
  @HttpCode(HttpStatus.OK)
  emailVerification(@Param('token') token: string): Promise<any> {
    return this.authService.emailVerification(token);
  }

  @Public()
  @UseGuards(RtGaurd)
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  refreshToken(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<Tokens> {
    return this.authService.refreshToken(userId, refreshToken);
  }
}
