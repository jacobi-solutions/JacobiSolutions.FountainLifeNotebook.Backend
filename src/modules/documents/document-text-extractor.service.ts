import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';

@Injectable()
export class DocumentTextExtractorService {
  async extractText(buffer: Buffer, originalFileName: string, contentType: string): Promise<string> {
    const extension = extname(originalFileName).toLowerCase();

    if (contentType === 'application/pdf' || extension === '.pdf') {
      return this.normalizeText(await this.extractPdfText(buffer));
    }

    if (
      contentType.startsWith('text/') ||
      ['.md', '.markdown', '.txt'].includes(extension)
    ) {
      return this.normalizeText(buffer.toString('utf8'));
    }

    throw new BadRequestException('Unsupported document type. Upload a PDF, Markdown, or plain text file.');
  }

  private async extractPdfText(buffer: Buffer) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  private normalizeText(text: string) {
    const normalized = text
      .replace(/\r/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (normalized.length === 0) {
      throw new BadRequestException('The document did not contain extractable text.');
    }

    return normalized;
  }
}
