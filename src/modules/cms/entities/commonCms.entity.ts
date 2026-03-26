import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
class BaseCms {
  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, default: null })
  heading: string;

  @Prop({ type: String, default: null })
  description: string;
}

const BaseCmsSchema = SchemaFactory.createForClass(BaseCms);
type IBaseCms = HydratedDocument<BaseCms>;

@Schema({ timestamps: true })
class ContactUsSection {
  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, default: null })
  heading: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String, default: null })
  title: string;
  @Prop({ type: String, default: null })
  email: string;
  @Prop({ type: String, default: null })
  phoneNo: string;
  @Prop({ type: String, default: null })
  timings: string;

  @Prop({ type: String })
  text: string;
}

const ContactUsSectionSchema = SchemaFactory.createForClass(ContactUsSection);
type IContactUsSection = HydratedDocument<ContactUsSection>;

@Schema({ timestamps: true })
class Section {
  @Prop({ type: String, default: null })
  heading: string;

  @Prop({ type: String, default: null })
  subHeading: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String, default: null })
  image: string;
}

const SectionSchema = SchemaFactory.createForClass(Section);
type ISection = HydratedDocument<Section>;

export {
  BaseCms,
  BaseCmsSchema,
  IBaseCms,
  ContactUsSection,
  ContactUsSectionSchema,
  IContactUsSection,
  Section,
  SectionSchema,
  ISection,
};
