import { UnauthorizedException } from '@nestjs/common';
import { mapCognitoAccessToken } from './cognito-token';

describe('mapCognitoAccessToken', () => {
  it('maps Cognito access token claims to the authenticated user', () => {
    expect(
      mapCognitoAccessToken(
        {
          client_id: 'client-1',
          sub: 'user-1',
          token_use: 'access',
          username: 'user@example.com',
        },
        'client-1',
      ),
    ).toEqual({
      email: 'user@example.com',
      subject: 'user-1',
      username: 'user@example.com',
    });
  });

  it('leaves email empty when Cognito username is not an email address', () => {
    expect(
      mapCognitoAccessToken(
        {
          client_id: 'client-1',
          sub: 'user-1',
          token_use: 'access',
          username: 'cognito-user-name',
        },
        'client-1',
      ),
    ).toEqual({
      email: null,
      subject: 'user-1',
      username: 'cognito-user-name',
    });
  });

  it('rejects id tokens as API bearer credentials', () => {
    expect(() =>
      mapCognitoAccessToken(
        {
          aud: 'client-1',
          email: 'user@example.com',
          sub: 'user-1',
          token_use: 'id',
        },
        'client-1',
      ),
    ).toThrow(UnauthorizedException);
  });

  it('rejects access tokens issued for another client', () => {
    expect(() =>
      mapCognitoAccessToken(
        {
          client_id: 'client-2',
          sub: 'user-1',
          token_use: 'access',
        },
        'client-1',
      ),
    ).toThrow(UnauthorizedException);
  });
});
