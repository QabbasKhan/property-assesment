import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BaseCmsSchema,
  ContactUsSectionSchema,
  IBaseCms,
  IContactUsSection,
  ISection,
  SectionSchema,
} from './commonCms.entity';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
class About {
  @Prop({ type: String, default: null })
  name: string;

  @Prop({ type: String, default: null })
  role: string;

  @Prop({ type: String, default: null })
  bio: string;

  @Prop({ type: String, default: null })
  visionTitle: string;

  @Prop({ type: String, default: null })
  visionText: string;

  @Prop({ type: String, default: null })
  image: string;
}

const AboutSchema = SchemaFactory.createForClass(About);
type IAbout = HydratedDocument<About>;

@Schema({ timestamps: true })
class AboutCms {
  @Prop({ type: BaseCmsSchema, default: null })
  heroSection: IBaseCms;

  @Prop({ type: SectionSchema, default: null })
  sectionOne: ISection;

  @Prop({ type: AboutSchema, default: null })
  aboutMe: IAbout;

  @Prop({ type: SectionSchema, default: null })
  sectionTwo: ISection;

  @Prop({ type: SectionSchema, default: null })
  sectionThree: ISection;

  @Prop({ type: SectionSchema, default: null })
  sectionFour: ISection;

  @Prop({ type: ContactUsSectionSchema, default: null })
  banner: IContactUsSection;
}

const AboutCmsSchema = SchemaFactory.createForClass(AboutCms);
type IAboutCms = HydratedDocument<AboutCms>;

export { AboutCms, AboutCmsSchema, IAboutCms };
