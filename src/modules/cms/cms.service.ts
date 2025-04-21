import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import { S3Service } from 'src/shared/s3.service';
import { ICms } from './entities/cms.entity';
import { CMS_TYPE } from './enums/cms.enum';

@Injectable()
export class CmsService {
  constructor(
    @InjectModel('Cms') private readonly Cms: Model<ICms>,
    // private readonly s3Storage: S3Service,
  ) {}

  async getPage(pageName: string): Promise<ICms> {
    let doc = null;

    doc = await this.Cms.findOne({ pageName });
    return doc;
  }

  async updatePage(pageName: CMS_TYPE, body: any): Promise<any> {
    let doc = null;

    // switch (pageName) {
    //   case CMS_TYPE.HOME:
    //     doc = await this.updateHomePage(body);
    //     break;
    //   case CMS_TYPE.FOOTER:
    //     doc = await this.updateFooterPage(body);
    //     break;
    //   default:
    //     throw new BadRequestException('Invalid page name');
    // }

    return doc;
  }

  // async updateHomePage(body: IHomeCms) {
  //   const cms = await this.Cms.findOne({ pageName: CMS_TYPE.HOME }).lean();
  //   const prev = cms?.[CMS_TYPE.HOME];

  //   const filesToDelete: string[] = [];

  //   const compareImages = (newImage?: string, oldImage?: string) => {
  //     if (newImage !== oldImage && oldImage) {
  //       filesToDelete.push(oldImage);
  //     }
  //   };

  //   body.sliders?.forEach((newSlide, index) => {
  //     const oldSlide = prev?.sliders?.[index];
  //     if (oldSlide) {
  //       compareImages(newSlide.left_image, oldSlide.left_image);
  //       compareImages(newSlide.right_image, oldSlide.right_image);
  //     }
  //   });

  //   body.cards?.forEach((newCard, index) => {
  //     const oldCard = prev?.cards?.[index];
  //     if (oldCard) {
  //       compareImages(newCard.main_image, oldCard.main_image);
  //     }
  //   });

  //   body.promo_cards?.forEach((newPromo, index) => {
  //     const oldPromo = prev?.promo_cards?.[index];
  //     if (oldPromo) {
  //       compareImages(newPromo.logo_image, oldPromo.logo_image);
  //       compareImages(newPromo.main_image, oldPromo.main_image);
  //     }
  //   });

  //   compareImages(body.banner_left_image, prev?.banner_left_image);
  //   compareImages(body.banner_right_image, prev?.banner_right_image);

  //   body.partners?.forEach((image, index) => {
  //     const oldImage = prev?.partners?.[index];
  //     if (oldImage) {
  //       compareImages(image.logo, oldImage.logo);
  //     }
  //   });

  //   await Promise.all(
  //     filesToDelete.map((file) => this.s3Storage.deleteFile(file)),
  //   );

  //   const doc = await this.Cms.findOneAndUpdate(
  //     { pageName: CMS_TYPE.HOME },
  //     { [CMS_TYPE.HOME]: body },
  //     {
  //       new: true,
  //       upsert: true,
  //     },
  //   );
  //   return doc;
  // }
}
