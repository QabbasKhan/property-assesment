import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CMS_TYPE } from '../enums/cms.enum';
import { HomeCmsSchema, IHomeCms } from './homeCms.entity';
import { AboutCmsSchema, IAboutCms } from './aboutCms.entity';
import { IProductCms, ProductCmsSchema } from './productCms.entity';
import { IContactUs, ContactUsSchema } from './contactUs.entity';

@Schema({ timestamps: true })
class Socials {
  @Prop({ type: String, default: null })
  url: string;
  sss;
  @Prop({ type: String, default: null })
  icon: string;
}

const SocialsSchema = SchemaFactory.createForClass(Socials);
type ISocials = HydratedDocument<Socials>;

@Schema({ timestamps: true })
class FooterCms {
  @Prop({ type: String, default: null })
  copyRightText: string;

  @Prop({ type: [SocialsSchema], default: {} })
  socials: ISocials[];
}

const FooterCmsSchema = SchemaFactory.createForClass(FooterCms);
type IFooterCms = HydratedDocument<FooterCms>;
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
    type: HomeCmsSchema,
  })
  [CMS_TYPE.HOME]: IHomeCms;

  @Prop({
    type: AboutCmsSchema,
  })
  [CMS_TYPE.ABOUT_US]: IAboutCms;

  @Prop({
    type: ProductCmsSchema,
  })
  [CMS_TYPE.PRODUCT]: IProductCms;

  @Prop({
    type: ContactUsSchema,
  })
  [CMS_TYPE.CONTACT_US]: IContactUs;

  @Prop({
    type: FooterCmsSchema,
  })
  [CMS_TYPE.FOOTER]: IFooterCms;
}

type ICms = HydratedDocument<Cms>;
const CmsSchema = SchemaFactory.createForClass(Cms);

export { Cms, CmsSchema, ICms, FooterCms, FooterCmsSchema, IFooterCms };
