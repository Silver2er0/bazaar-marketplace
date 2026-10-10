import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(10) description: string;
  @IsInt() @Min(1) priceCents: number;
  @IsInt() @Min(0) stock: number;
  @IsString() categoryId: string;
  @IsArray() @IsUrl({}, { each: true }) images: string[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class QueryProductsDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sort?: 'newest' | 'price_asc' | 'price_desc';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(48) limit = 12;
}

export class CreateReviewDto {
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsString() @MinLength(3) comment: string;
}
