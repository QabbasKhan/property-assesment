import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CMS_TYPE } from '../enums/cms.enum';

@Schema({ timestamps: true })
class Home {
  @Prop({ type: String, required: [true, 'Please mention the title'] })
  title: string;

  @Prop({ type: String, required: [true, 'Please mention the description'] })
  description: string;
}

type IHome = HydratedDocument<Home>;
const HomeSchema = SchemaFactory.createForClass(Home);
@Schema({ timestamps: true })
class Cms {
  @Prop({
    type: String,
    required: [true, 'Please mention the page name'],
    enum: CMS_TYPE,
    unique: true,
  })
  pageName: CMS_TYPE;

  @Prop({
    type: HomeSchema,
  })
  [CMS_TYPE.HOME]: Home;
}

type ICms = HydratedDocument<Cms>;
const CmsSchema = SchemaFactory.createForClass(Cms);

export { Cms, CmsSchema, ICms };
