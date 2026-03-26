import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  BaseCmsSchema,
  ContactUsSectionSchema,
  IBaseCms,
  IContactUsSection,
} from './commonCms.entity';

@Schema({ timestamps: true })
class AssessmentSection {
  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, default: null })
  heading: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String, default: null })
  formTextOne: string;

  @Prop({ type: String, default: null })
  formTextTwo: string;
}

const AssessmentSectionSchema = SchemaFactory.createForClass(AssessmentSection);
type IAssessmentSection = HydratedDocument<AssessmentSection>;

@Schema({ timestamps: true })
class AboutSection {
  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, default: null })
  heading: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: [BaseCmsSchema], default: [] })
  features: IBaseCms[];
}

const AboutSectionSchema = SchemaFactory.createForClass(AboutSection);
type IAboutSection = HydratedDocument<AboutSection>;

@Schema({ timestamps: true })
class BenefitsSection {
  @Prop({ type: String, default: null })
  heading: string;

  @Prop({ type: [BaseCmsSchema], default: [] })
  benefits: IBaseCms[];
}

const BenefitsSectionSchema = SchemaFactory.createForClass(BenefitsSection);
type IBenefitsSection = HydratedDocument<BenefitsSection>;

@Schema({ timestamps: true })
class ExpansionSection {
  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, default: null })
  heading: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String, default: null })
  title: string;
  @Prop({ type: String, default: null })
  subtitle: string;
  @Prop({ type: String, default: null })
  text: string;
  @Prop({ type: String, default: null })
  caption: string;
}

const ExpansionSectionSchema = SchemaFactory.createForClass(ExpansionSection);
type IExpansionSection = HydratedDocument<ExpansionSection>;

@Schema({ timestamps: true })
class HomeCms {
  @Prop({ type: AssessmentSectionSchema, default: null })
  assesmentSection: IAssessmentSection;

  @Prop({ type: AboutSectionSchema, default: null })
  aboutSection: IAboutSection;

  @Prop({ type: BaseCmsSchema, default: null })
  plansSection: IBaseCms;

  @Prop({ type: BenefitsSectionSchema, default: null })
  benefitsSection: IBenefitsSection;

  @Prop({ type: BaseCmsSchema, default: null })
  blogSection: IBaseCms;

  @Prop({ type: ExpansionSectionSchema, default: null })
  expansionSection: IExpansionSection;

  @Prop({ type: BaseCmsSchema, default: null })
  banner: IBaseCms;

  @Prop({ type: BaseCmsSchema, default: null })
  loginSection: IBaseCms;

  @Prop({ type: ContactUsSectionSchema, default: null })
  contactUsSection: IContactUsSection;
}

const HomeCmsSchema = SchemaFactory.createForClass(HomeCms);
type IHomeCms = HydratedDocument<HomeCms>;

export { HomeCms, HomeCmsSchema, IHomeCms };
