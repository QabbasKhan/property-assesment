import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CMS_TYPE } from '../enums/cms.enum';

@Schema({ timestamps: true })
class Cms {
  @Prop({
    type: String,
    required: [true, 'Please mention the page name'],
    enum: CMS_TYPE,
    unique: true,
  })
  pageName: CMS_TYPE;
}

type ICms = HydratedDocument<Cms>;
const CmsSchema = SchemaFactory.createForClass(Cms);

export { Cms, CmsSchema, ICms };
