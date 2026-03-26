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
class ProductCms {
  @Prop({ type: BaseCmsSchema, default: null })
  heroSection: IBaseCms;

  @Prop({ type: SectionSchema, default: null })
  sectionOne: ISection;

  @Prop({ type: SectionSchema, default: null })
  sectionTwo: ISection;

  @Prop({ type: SectionSchema, default: null })
  sectionThree: ISection;

  @Prop({ type: SectionSchema, default: null })
  sectionFour: ISection;
  @Prop({ type: SectionSchema, default: null })
  sectionFive: ISection;
  @Prop({ type: SectionSchema, default: null })
  sectionSix: ISection;
  @Prop({ type: SectionSchema, default: null })
  sectionSeven: ISection;
  @Prop({ type: SectionSchema, default: null })
  sectionEight: ISection;
  @Prop({ type: SectionSchema, default: null })
  sectionNine: ISection;
  @Prop({ type: SectionSchema, default: null })
  sectionTen: ISection;
  @Prop({ type: SectionSchema, default: null })
  sectionEleven: ISection;

  @Prop({ type: ContactUsSectionSchema, default: null })
  banner: IContactUsSection;
}

const ProductCmsSchema = SchemaFactory.createForClass(ProductCms);
type IProductCms = HydratedDocument<ProductCms>;

export { ProductCms, ProductCmsSchema, IProductCms };
