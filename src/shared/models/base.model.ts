import { Prop } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';

export abstract class BaseModel {
  @Prop({ default: () => randomUUID(), index: true, required: true, unique: true })
  id!: string;

  @Prop({ default: () => new Date(), required: true })
  createdDateUtc!: Date;

  @Prop({ default: () => new Date(), required: true })
  lastUpdatedDateUtc!: Date;
}
