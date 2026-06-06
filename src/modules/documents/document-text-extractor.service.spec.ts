import { BadRequestException } from '@nestjs/common';
import { DocumentTextExtractorService } from './document-text-extractor.service';

describe('DocumentTextExtractorService', () => {
  it('extracts and normalizes plain text documents', async () => {
    const service = new DocumentTextExtractorService();

    await expect(
      service.extractText(Buffer.from('Line one.  \n\n\nLine two.'), 'notes.txt', 'text/plain'),
    ).resolves.toBe('Line one.\n\nLine two.');
  });

  it('rejects unsupported document types', async () => {
    const service = new DocumentTextExtractorService();

    await expect(
      service.extractText(Buffer.from('{}'), 'data.json', 'application/json'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
