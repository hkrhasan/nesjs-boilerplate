import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, PhoneAuthDto, VerifyPhoneAuthDto } from './dto';
import { JwtPayload, Tokens } from './types';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User, UserRole } from '@prisma/client';
import Hashids from 'hashids';
import { getUnixTime } from 'date-fns';
import { SMSService } from '../sms/sms.service';
import { MailService } from '../mail/mail.service';
import btoa from 'btoa';
import atob from 'atob';
import { TokenExpiredError } from 'jsonwebtoken';
import { CustomForbiddenException } from 'src/utils';

@Injectable()
export class AuthService {
  private hashId: Hashids;
  private env: string;
  private isProduction: boolean;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private sms: SMSService,
    private mail: MailService,
  ) {
    this.hashId = new Hashids();
    this.env = config.get<string>('NODE_ENV');
    this.isProduction = this.env === 'production' || this.env === 'staging';
  }

  async phoneAuth(dto: PhoneAuthDto) {
    try {
      const user = await this.checkPhoneExistOrNot(dto.phone, dto.referralCode);

      if (this.isProduction) {
        await this.sms.phoneVerify(dto.phone);
        return { msg: `send otp on ${dto.phone}` };
      }

      // Create Lean Customer
      if (user.isFirstLogin) {
        // Todo: Some logic for first login
      } else {
        // Todo: Some logic for not first login
      }

      const returnObj = {
        email: user.email,
        image: user.image,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        username: user.userName,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        phoneVerified: true,
      };

      const tokens = await this.getTokens(user.id, user.phone, user.role);

      return { ...returnObj, ...tokens };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(`===================================`);
        console.log(`DATABASE ERROR => ${error.code}`);
        console.log(`DATABASE MESSAGE => ${error.message}`);
        console.log(`===================================`);
        throw new CustomForbiddenException(
          `Something went wrong on phone auth`,
        );
      }

      throw error;
    }
  }

  async verifyPhoneAuth(
    dto: VerifyPhoneAuthDto,
    userId: number | undefined = undefined,
  ) {
    try {
      const { phone, otp } = dto;

      let user: User | undefined;

      if (userId !== undefined) {
        // Todo: Some logic for user tree
      } else {
        user = await this.prisma.user.findUnique({
          where: {
            phone,
          },
        });
      }

      if (this.isProduction) {
        if (!user || user.waitForOtp) {
          throw new CustomForbiddenException(`Unknown Phone!`);
        }

        const verificationResp: any = await this.sms.otpCheck(phone, otp);

        // if otp not verified
        if (!verificationResp?.valid) {
          throw new CustomForbiddenException(`Invalid Otp!`);
        }
      }

      // Create Lean Customer
      if (user.isFirstLogin) {
        // Todo: Some logic for first login
      } else {
        // Todo: Some logic for not first login
      }

      const returnObj = {
        userId: user.id,
        image: user.image,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        username: user.userName,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        phoneVerified: true,
      };

      const tokens = await this.getTokens(user.id, user.phone);

      return { ...returnObj, ...tokens };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(`===================================`);
        console.log(`DATABASE ERROR => ${error.code}`);
        console.log(`DATABASE MESSAGE => ${error.message}`);
        console.log(`===================================`);
        throw new CustomForbiddenException(
          `Something went wrong on phone auth verification`,
        );
      }
      throw error;
    }
  }

  async signup(dto: AuthDto) {
    try {
      const hash = await this.hashData(dto.password);

      const data = {
        email: dto.email,
        hash: hash,
        emailVerified: this.env === 'development',
        account: {
          create: {
            name: this.getName(dto.email),
            isActive: this.env === 'development',
          },
        },
        role: {
          set: [UserRole.USER],
        },
      };

      if (dto.referralCode) {
        data['referred'] = {
          connect: {
            referralCode: dto.referralCode,
          },
        };
      }

      const newUser = await this.prisma.user.create({
        data,
      });

      const referralCode = this.genRateReferralCode(newUser.id);

      // Update customer id
      await this.prisma.user.update({
        where: {
          id: newUser.id,
        },
        data: {
          referralCode: referralCode,
        },
      });

      // generate jwt token then update into database
      const { refresh_token, access_token } = await this.getTokens(
        newUser.id,
        newUser.email,
        newUser.role,
      );
      await this.updateRtHash(newUser.id, refresh_token);

      if (this.env === 'development') {
        return {
          access_token,
          refresh_token,
          email: newUser.email,
          phone: newUser.phone,
          referralCode: newUser.referralCode,
          isActive: newUser.isActive,
          emailVerified: newUser.emailVerified,
          phoneVerified: newUser.phoneVerified,
          username: newUser.userName,
        };
      }

      await this.sendEmailVerificationToken(newUser.email, access_token);

      return {
        created: true,
        message: 'Go to your inbox and verify your email',
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(`===================================`);
        console.log(`DATABASE ERROR => ${error.code}`);
        console.log(`DATABASE MESSAGE => ${error.message}`);
        console.log(`===================================`);

        if (error.code === 'P2002') {
          throw new CustomForbiddenException('Email is already exist!');
        }

        throw new CustomForbiddenException(
          `Something went wrong on signup process`,
        );
      }
      throw error;
    }
  }

  async signin(dto: AuthDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new CustomForbiddenException('Access Denied');

    const passwordMatches = await bcrypt.compare(dto.password, user.hash);

    if (!passwordMatches) throw new CustomForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);
    // return { ...tokens, email: user.email };
    return {
      ...tokens,
      email: user.email,
      phone: user.phone,
      referralCode: user.referralCode,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      image: user.image,
      username: user.userName,
    };
  }

  async logout(userId: number): Promise<boolean> {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: null,
      },
    });

    return true;
  }

  async refreshToken(userId: number, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashedRt) {
      throw new CustomForbiddenException('Not Authenticated');
    }

    const rtMatches = await bcrypt.compare(rt, user.hashedRt);

    if (!rtMatches) {
      throw new CustomForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async allUser(userId: number): Promise<User[]> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.role.includes(UserRole.ADMIN)) {
      throw new CustomForbiddenException(
        `Who are you may be you don't authorized`,
      );
    }

    return this.prisma.user.findMany();
  }

  async emailVerification(token: string): Promise<any> {
    try {
      const access_token = atob(token);
      const identification = await this.verifyToken(access_token);

      if (!identification.sub) {
        throw new CustomForbiddenException('Invalid Token');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id: identification.sub,
        },
      });

      if (!user) {
        throw new CustomForbiddenException('User not exist signup again');
      }

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          emailVerified: true,
        },
      });

      return { verified: true };
    } catch (error) {
      console.log(`===================================`);
      console.log(`DATABASE ERROR => ${error?.code}`);
      console.log(`DATABASE MESSAGE => ${error.message}`);
      console.log(`===================================`);
      return { verified: false };
    }
  }

  // Helper Functions
  async sendEmailVerificationToken(
    email: string,
    access_token?: string,
    userId?: number,
  ) {
    try {
      const panelUrl =
        this.config.get<string>('NODE_ENV') === 'development'
          ? this.config.get<string>('DEV_PANEL_URL')
          : this.config.get<string>('PROD_PANEL_URL');
      let token = access_token;

      if (!token) {
        const tokens = this.getTokens(userId as number, email);
        token = (await tokens).access_token;
      }

      await this.mail.sendEmail(email, 'verification', {
        name: email.split('@')[0],
        verificationLink: `${panelUrl}/email-verify/${btoa(token)}`,
      });

      return true;
    } catch (error) {
      throw new CustomForbiddenException(
        'Something went wrong on sending verification email',
      );
    }
  }

  async updateRtHash(userId: number, rt: string): Promise<void> {
    const hash = await this.hashData(rt);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  async getTokens(
    userId: number,
    identification: string,
    role: UserRole[] = [UserRole.USER],
  ): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      identification: identification,
      role: role,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('AT_SECRET'),
        expiresIn: 60 * 60 * 24 * 7, //60 * 15
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('RT_SECRET'),
        expiresIn: 60 * 60 * 24 * 7,
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('AT_SECRET'),
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new CustomForbiddenException('Token has expired');
      }
      throw new CustomForbiddenException('invalid token!');
    }
  }

  async getCustomToken(
    payload: object,
    options: object = {
      secret: this.config.get<string>('AT_SECRET'),
      expiresIn: 60 * 15 * 4 * 24,
    },
  ) {
    return await this.jwtService.signAsync(payload, options);
  }

  getName(email: string): string {
    const words: string[] = email.split('@');
    return words[0];
  }

  async checkPhoneExistOrNot(
    phone: string,
    referralCode: string,
    executiveId: number | undefined = undefined,
    role: UserRole = UserRole.USER,
  ) {
    try {
      const create = {
        phone: phone,
        role: {
          set: [role],
        },
      };

      if (referralCode) {
        create['referred'] = {
          connect: {
            referralCode,
          },
        };
      }

      if (executiveId !== undefined) {
        create['salesExecutive'] = {
          connect: {
            id: executiveId,
          },
        };
      }

      let user = await this.prisma.user.upsert({
        where: {
          phone: phone,
        },
        update: {},
        create,
      });

      if (!user.referralCode) {
        user = await this.prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            referralCode: this.hashId.encode(getUnixTime(new Date()) + user.id),
          },
        });
      }

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(`===================================`);
        console.log(`DATABASE ERROR => ${error.code}`);
        console.log(`DATABASE MESSAGE => ${error.message}`);
        console.log(`===================================`);
        throw new CustomForbiddenException(
          `Something went wrong with create or get user`,
        );
      }
      throw error;
    }
  }

  genRateReferralCode(userId: number) {
    return this.hashId.encode(getUnixTime(new Date()) + userId);
  }
}
