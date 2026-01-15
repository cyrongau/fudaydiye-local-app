
import { IsString, IsNumber, IsEnum, IsNotEmpty } from 'class-validator';


export class UpdateLocationDto {
    @IsString()
    @IsNotEmpty()
    riderId!: string;

    @IsNumber()
    latitude!: number;

    @IsNumber()
    longitude!: number;

    @IsEnum(['ONLINE', 'OFFLINE', 'BUSY'])
    status!: string;
}

export class AssignJobDto {
    @IsString()
    @IsNotEmpty()
    orderId!: string;

    @IsString()
    @IsNotEmpty()
    riderId!: string;
}

export class UpdateRiderStatusDto {
    @IsString()
    @IsNotEmpty()
    riderId!: string;

    @IsEnum(['ONLINE', 'OFFLINE', 'BUSY'])
    status!: string;
}

export class UpdateJobStatusDto {
    @IsString()
    @IsNotEmpty()
    orderId!: string;

    @IsEnum(['ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'])
    status!: string;

    @IsString()
    @IsNotEmpty()
    riderId!: string;
}
