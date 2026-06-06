import { ResponseFactory } from './response-factory';

describe('ResponseFactory', () => {
  it('creates successful base responses', () => {
    expect(ResponseFactory.success('correlation-1')).toEqual({
      correlationId: 'correlation-1',
      errors: [],
      isSuccess: true,
    });
  });

  it('creates successful responses with endpoint fields', () => {
    expect(ResponseFactory.successWith({ model: { id: 'model-1' } }, 'correlation-1')).toEqual({
      correlationId: 'correlation-1',
      errors: [],
      isSuccess: true,
      model: { id: 'model-1' },
    });
  });

  it('creates failure base responses', () => {
    expect(
      ResponseFactory.failure(
        { errorCode: 'VALIDATION_ERROR', errorMessage: 'Name is required.' },
        'correlation-1',
      ),
    ).toEqual({
      correlationId: 'correlation-1',
      errors: [{ errorCode: 'VALIDATION_ERROR', errorMessage: 'Name is required.' }],
      isSuccess: false,
    });
  });
});
