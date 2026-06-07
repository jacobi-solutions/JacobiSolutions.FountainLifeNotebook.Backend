import { DocumentChunksRepository } from '../../documents/document-chunks.repository';
import { NotebookRetrievalService } from './notebook-retrieval.service';

describe('NotebookRetrievalService', () => {
  it('scores chunks by query-token overlap and returns the best matches', async () => {
    const chunksRepository = {
      findByNotebookAndDocumentIds: jest.fn(async () => [
        {
          chunkIndex: 0,
          documentId: 'document-1',
          documentName: 'wellness.txt',
          text: 'Fountain Life members receive longevity diagnostics and clinical guidance.',
        },
        {
          chunkIndex: 1,
          documentId: 'document-1',
          documentName: 'wellness.txt',
          text: 'The cafeteria menu changes every week.',
        },
      ]),
    } as unknown as DocumentChunksRepository;
    const service = new NotebookRetrievalService(chunksRepository);

    const results = await service.retrieve(
      'What diagnostics guidance do members receive?',
      'user-1',
      'notebook-1',
      ['document-1'],
    );

    expect(chunksRepository.findByNotebookAndDocumentIds).toHaveBeenCalledWith(
      'notebook-1',
      ['document-1'],
    );
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        chunkIndex: 0,
        documentId: 'document-1',
        score: 4,
      }),
    );
  });
});
