import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser, type AuthUser } from '../common/auth.decorator.js';
import {
  CreateProductDto,
  CreateReviewDto,
  QueryProductsDto,
  UpdateProductDto,
} from './products.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: QueryProductsDto) {
    return this.products.list(query);
  }

  @Auth('SELLER', 'ADMIN')
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.products.mine(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @Auth('SELLER', 'ADMIN')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.products.create(user.id, dto);
  }

  @Auth('SELLER', 'ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(id, user, dto);
  }

  @Auth('SELLER', 'ADMIN')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.products.remove(id, user);
  }

  @Auth()
  @Post(':id/reviews')
  review(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.products.review(id, user.id, dto);
  }
}
