import { ApiProperty } from '@nestjs/swagger';
import { DocumentContentSection } from './document-content-section';
import { DocumentSummary } from './document-summary';

export class DocumentDetail extends DocumentSummary {
  @ApiProperty({ type: [DocumentContentSection] })
  chunks!: DocumentContentSection[];
}
