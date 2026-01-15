import { IsString, IsEmail, IsEnum, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    VENDOR = 'VENDOR',
    RIDER = 'RIDER',
    CLIENT = 'CLIENT',
    ADMIN = 'ADMIN',
    FUDAYDIYE_ADMIN = 'FUDAYDIYE_ADMIN'
}

export enum VendorStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    REJECTED = 'REJECTED'
}

export enum KycStatus {
    NONE = 'NONE',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED'
}

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    uid!: string;

    @IsString()
    @IsNotEmpty()
    fullName!: string;

    @IsString()
    @IsNotEmpty()
    mobile!: string;

    @IsEmail()
    email!: string;

    @IsEnum(UserRole)
    role!: UserRole;

    // Optional derived fields

    @IsString()
    @IsOptional()
    businessName?: string;

    @IsString()
    @IsOptional()
    businessLogo?: string;
}

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    businessName?: string;

    @IsString()
    @IsOptional()
    businessLogo?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    vehicleType?: string;

    @IsString()
    @IsOptional()
    plateNumber?: string;
}

export class UpdateUserStatusDto {
    @IsString()
    @IsOptional()
    status?: string;

    @IsEnum(VendorStatus)
    @IsOptional()
    vendorStatus?: VendorStatus;

    @IsBoolean()
    @IsOptional()
    isAccountLocked?: boolean;

    @IsBoolean()
    @IsOptional()
    canStream?: boolean;
}

export class UpdateRoleDto {
    @IsEnum(UserRole)
    role!: UserRole;
}
