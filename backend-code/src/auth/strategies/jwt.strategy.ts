import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  jti: string;   // JWT ID unique — utilisé pour la révocation dans Redis
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    // Vérification optionnelle : le token access n'est pas révoqué
    // (utile pour un logout immédiat avant expiration des 15min)
    // Note : en prod, activer seulement si la latence Redis est acceptable
    // const revoked = await this.redis.exists(`revoked:${payload.jti}`);
    // if (revoked) throw new UnauthorizedException('Token révoqué');

    return { id: payload.sub, email: payload.email, jti: payload.jti };
  }
}
