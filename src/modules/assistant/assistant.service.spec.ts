import { AssistantService } from './assistant.service';
import { AssistantConversationsRepository } from './assistant-conversations.repository';

describe('AssistantService', () => {
  it('creates a persisted conversation and streams user plus assistant updates', async () => {
    const savedConversations = [];
    const repository = {
      create: jest.fn(async (conversation) => ({
        ...conversation,
        createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
        id: 'conversation-1',
        lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
        save: jest.fn(),
      })),
      saveConversation: jest.fn(async (conversation) => {
        savedConversations.push([...conversation.items]);
        return conversation;
      }),
    } as unknown as AssistantConversationsRepository;
    const service = new AssistantService(repository);
    const updates = [];

    for await (const update of service.streamMessage(
      'support',
      { message: 'hello', participantUserIds: ['teammate-1'] },
      { email: 'user@example.com', subject: 'sub-123', username: 'user@example.com' },
    )) {
      updates.push(update);
    }

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assistantKey: 'support',
        participants: expect.arrayContaining([
          expect.objectContaining({ role: 'owner', userId: 'sub-123' }),
          expect.objectContaining({ role: 'member', userId: 'teammate-1' }),
        ]),
      }),
    );
    expect(repository.saveConversation).toHaveBeenCalledTimes(2);
    expect(savedConversations[0]).toHaveLength(1);
    expect(savedConversations[1]).toHaveLength(2);
    expect(updates).toHaveLength(3);
    expect(updates[0]).toEqual(expect.objectContaining({ role: 'user', type: 'message' }));
    expect(updates[2]).toEqual(
      expect.objectContaining({
        role: 'assistant',
        type: 'message',
      }),
    );
  });

  it('rejects existing conversations when the user is not an active participant', async () => {
    const repository = {
      findById: jest.fn(async () => ({
        id: 'conversation-1',
        items: [],
        participants: [{ status: 'active', userId: 'someone-else' }],
      })),
    } as unknown as AssistantConversationsRepository;
    const service = new AssistantService(repository);

    await expect(async () => {
      for await (const _update of service.streamMessage(
        'support',
        { conversationId: 'conversation-1', message: 'hello' },
        { email: 'user@example.com', subject: 'sub-123', username: 'user@example.com' },
      )) {
        // No-op.
      }
    }).rejects.toThrow('User is not a participant in this conversation.');
  });
});
