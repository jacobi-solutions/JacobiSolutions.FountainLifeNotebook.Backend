import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '../../../shared/models/base.model';

export type AccountDocument = HydratedDocument<Account>;

@Schema({ collection: 'accounts', id: false })
export class Account extends BaseModel {
  @Prop({ index: true, required: true, unique: true })
  cognitoSubject!: string;

  @Prop({ index: true, required: true })
  email!: string;

  @Prop({ required: true })
  username!: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
