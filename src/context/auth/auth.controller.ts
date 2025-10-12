import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { User } from 'src/app/users/entities/user.entity';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { PayloadToken } from '../shared/models/token.model';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req: Request) {
    const { user } = req.user as { user: User };
    return this.authService.generateJWT(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-token')
  @ApiResponse({ status: 200, description: 'Valid token' })
  async verifyToken(@Req() req: Request) {
    const tokenData = req.user as PayloadToken;
    const user = await this.authService.validateUserJwt(tokenData.sub);
    return {
      valid: !!user,
      user: user,
    };
  }
}
