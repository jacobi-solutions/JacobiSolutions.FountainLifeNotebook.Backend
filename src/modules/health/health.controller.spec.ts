import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns an ok health response', () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual(
      expect.objectContaining({
        name: 'fountain-life-notebook-api',
        status: 'ok',
      }),
    );
  });
});
