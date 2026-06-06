import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { FountainLifeConfig } from '../../shared/config/app.config';
import { CognitoJwtPayload, mapCognitoAccessToken } from './cognito-token';
import type { AuthenticatedUser } from './models/authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly cognitoClientId: string;

  constructor(configService: ConfigService) {
    const config = configService.getOrThrow<FountainLifeConfig>('fountainLife');

    super({
      issuer: config.cognitoIssuer,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${config.cognitoIssuer}/.well-known/jwks.json`,
      }),
    });

    this.cognitoClientId = config.cognitoClientId;
  }

  validate(payload: CognitoJwtPayload): AuthenticatedUser {
    return mapCognitoAccessToken(payload, this.cognitoClientId);
  }
}
