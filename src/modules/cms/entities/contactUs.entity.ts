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
class ContactUs {
  @Prop({ type: BaseCmsSchema, default: null })
  heroSection: IBaseCms;

  @Prop({ type: SectionSchema, default: null })
  sectionOne: ISection;

  @Prop({ type: ContactUsSectionSchema, default: null })
  contactUsSection: IContactUsSection;
}

const ContactUsSchema = SchemaFactory.createForClass(ContactUs);
type IContactUs = HydratedDocument<ContactUs>;

export { ContactUs, ContactUsSchema, IContactUs };
