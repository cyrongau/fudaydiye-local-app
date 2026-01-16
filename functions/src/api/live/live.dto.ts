
import { IsString, IsNotEmpty, IsEnum, IsArray, IsOptional } from 'class-validator';

export class CreateReplayDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    videoUrl!: string;

    @IsString()
    thumbnailUrl!: string;

    @IsString()
    hostId!: string;
}

export class ReplayResponseDto {
    id!: string;
    title!: string;
    views!: number;
    thumbnailUrl!: string;
    createdAt!: Date;
}

export class CreateSessionDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    category!: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['LIVE', 'SCHEDULE'])
    mode!: 'LIVE' | 'SCHEDULE';

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    productIds?: string[];
}

export class UpdateSessionStatusDto {
    @IsString()
    @IsNotEmpty()
    @IsEnum(['LIVE', 'ENDED'])
    status!: 'LIVE' | 'ENDED';
}

export class UpdateSessionDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['LIVE', 'SCHEDULE', 'ENDED'])
    status?: 'LIVE' | 'SCHEDULE' | 'ENDED';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    productIds?: string[];

    @IsOptional()
    scheduledAt?: any; // Allow date or string or processed timestamp

    @IsOptional()
    @IsString()
    featuredProductId?: string;

    @IsOptional()
    @IsString()
    featuredProductName?: string;

    @IsOptional()
    featuredProductPrice?: number;

    @IsOptional()
    @IsString()
    featuredProductImg?: string;
}

export class PinProductDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;
}
