import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class RequestOtpDto {
    @IsString()
    @IsNotEmpty()
    identifier!: string;

    @IsEnum(['email', 'phone'])
    method!: string;
}

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    identifier!: string;

    @IsString()
    @IsNotEmpty()
    code!: string;
}

export class RegisterUserDto {
    @IsString()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;

    @IsString()
    @IsNotEmpty()
    fullName!: string;

    @IsString()
    mobile?: string;

    @IsString()
    anonUid?: string; // Optional: If upgrading an anonymous session

    @IsEnum(['CUSTOMER', 'VENDOR', 'RIDER', 'CLIENT'])
    @IsOptional()
    role?: 'CUSTOMER' | 'VENDOR' | 'RIDER' | 'CLIENT';

    // Vendor/Client specific fields
    @IsString()
    @IsOptional()
    businessName?: string;

    @IsString()
    @IsOptional()
    businessCategory?: string;

    @IsString()
    @IsOptional()
    vehicleType?: string;

    @IsString()
    @IsOptional()
    plateNumber?: string;
}
