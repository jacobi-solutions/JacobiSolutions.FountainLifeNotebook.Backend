import { UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser } from './models/authenticated-user';

export interface CognitoJwtPayload {
  aud?: string;
  client_id?: string;
  email?: string;
  sub: string;
  token_use?: string;
  username?: string;
}

export function mapCognitoAccessToken(
  payload: CognitoJwtPayload,
  expectedClientId: string,
): AuthenticatedUser {
  if (payload.token_use !== 'access') {
    throw new UnauthorizedException('Cognito access token is required.');
  }

  const clientId = payload.client_id ?? payload.aud;
  if (clientId !== expectedClientId) {
    throw new UnauthorizedException('Cognito token was not issued for this client.');
  }

  return {
    email: payload.email ?? null,
    subject: payload.sub,
    username: payload.username ?? payload.email ?? payload.sub,
  };
}
