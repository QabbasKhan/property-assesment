import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MortgagesService } from './mortgages.service';
import { CreateMortgageDto } from './dto/create-mortgage.dto';
import { UpdateMortgageDto } from './dto/update-mortgage.dto';

@Controller({ path: 'mortgage', version: '1' })
export class MortgagesController {
  constructor(private readonly mortgagesService: MortgagesService) {}

  @Post('/test')
  async create(@Body() createMortgageDto: CreateMortgageDto) {
    const data = await this.mortgagesService.test(createMortgageDto);
    return { data };
  }

  @Get()
  findAll() {
    return this.mortgagesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.mortgagesService.findOne(id);
    return data;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMortgageDto: UpdateMortgageDto,
  ) {
    return this.mortgagesService.update(+id, updateMortgageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mortgagesService.remove(+id);
  }
}
