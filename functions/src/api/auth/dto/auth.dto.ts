import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

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
