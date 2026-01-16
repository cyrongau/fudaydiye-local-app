
import { IsString, IsNotEmpty, IsObject, IsOptional, IsArray } from 'class-validator';

export class UpdateSystemConfigDto {
    @IsObject()
    @IsOptional()
    integrations?: Record<string, any>;

    @IsObject()
    @IsOptional()
    settings?: {
        commission?: number;
        expressFee?: number;
        dynamicPricingActive?: boolean;
        exchangeRate?: number;
    };

    @IsObject()
    @IsOptional()
    business?: {
        title?: string;
        shortDesc?: string;
        address?: string;
        phone?: string;
        email?: string;
    };
}

export class SaveCMSContentDto {
    @IsString()
    @IsNotEmpty()
    type!: string; // 'PAGE' | 'HERO_SLIDER' | 'PROMO_CARD'

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    subtitle?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    status?: 'DRAFT' | 'PUBLISHED';

    @IsString()
    @IsOptional()
    category?: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    tags?: string[];

    @IsString()
    @IsOptional()
    featuredImage?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    ctaText?: string;

    @IsString()
    @IsOptional()
    ctaLink?: string;

    @IsString()
    @IsOptional()
    linkedProductId?: string;

    @IsString()
    @IsOptional()
    linkedVendorId?: string;

    @IsString()
    @IsOptional()
    section?: string;
}
