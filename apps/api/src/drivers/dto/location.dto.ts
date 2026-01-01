import { IsNumber, IsOptional, IsISO8601 } from 'class-validator';

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsISO8601()
  ts?: string;
}
