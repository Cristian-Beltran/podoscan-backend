import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import config from 'src/context/shared/config';
import { PayloadToken } from 'src/context/shared/models/token.model';
import { AuthService } from '../auth.service';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
    private authService: AuthService,
  ) {
    super({
      secretOrKey: configService.jwtSecret,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }
  async validate(payload: PayloadToken) {
    const user = await this.authService.validateUserJwt(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
