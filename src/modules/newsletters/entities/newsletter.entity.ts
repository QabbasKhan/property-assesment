import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class NewsLetter {
  @Prop({ type: String, unique: true, required: true, lowercase: true })
  email: string;
}

export const NewsLetterSchema = SchemaFactory.createForClass(NewsLetter);
export type INewsLetter = HydratedDocument<NewsLetter>;
