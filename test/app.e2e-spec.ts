import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AssistantController } from '../src/modules/assistants/assistant.controller';
import { AssistantService } from '../src/modules/assistants/assistant.service';
import { NOTEBOOK_ASSISTANT_KEY } from '../src/modules/assistants/notebook-assistant/notebook-assistant.constants';
import { AuthenticatedUserGuard } from '../src/modules/auth/authenticated-user.guard';
import { HealthController } from '../src/modules/health/health.controller';
import { GlobalExceptionFilter } from '../src/shared/http/global-exception.filter';

describe('Fountain Life Notebook API e2e', () => {
  let app: INestApplication<App>;
  const assistantService = {
    getConversation: jest.fn(async (conversationId: string) => ({
      assistantKey: NOTEBOOK_ASSISTANT_KEY,
      createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      id: conversationId,
      lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      messages: [],
      participants: [],
    })),
    listAssistants: jest.fn(() => []),
    streamMessage: jest.fn(async function* () {}),
  };
  const authGuard: CanActivate = {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      request.user = {
        email: 'user@example.com',
        subject: 'user-1',
        username: 'user@example.com',
      };
      return true;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AssistantController, HealthController],
      providers: [{ provide: AssistantService, useValue: assistantService }],
    })
      .overrideGuard(AuthenticatedUserGuard)
      .useValue(authGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(
      (
        request: Request & { correlationId?: string },
        response: Response,
        next: NextFunction,
      ) => {
        request.correlationId = 'e2e-correlation-id';
        response.setHeader('x-correlation-id', 'e2e-correlation-id');
        next();
      },
    );
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves health under the API prefix', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'fountain-life-notebook-api',
        status: 'ok',
      }),
    );
  });

  it('accepts direct request fields for POST endpoints', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/assistants/get-conversation')
      .send({ conversationId: 'conversation-1' })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        conversation: expect.objectContaining({
          id: 'conversation-1',
        }),
        correlationId: 'e2e-correlation-id',
        errors: [],
        isSuccess: true,
      }),
    );
    expect(assistantService.getConversation).toHaveBeenCalledWith(
      'conversation-1',
      expect.objectContaining({ subject: 'user-1' }),
    );
  });

  it('rejects invalid direct request fields before controller execution', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/assistants/get-conversation')
      .send({})
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        correlationId: 'e2e-correlation-id',
        isSuccess: false,
      }),
    );
    expect(assistantService.getConversation).not.toHaveBeenCalled();
  });

  it('returns a structured SSE failure when assistant streaming fails', async () => {
    assistantService.streamMessage.mockImplementationOnce(async function* () {
      throw new Error('retrieval failed');
    });

    const response = await request(app.getHttpServer())
      .post('/api/assistants/notebook/stream-message')
      .send({ message: 'hello', notebookId: 'notebook-1' })
      .expect(200);

    expect(response.text).toContain('ASSISTANT_STREAM_ERROR');
    expect(response.text).toContain('retrieval failed');
  });
});
