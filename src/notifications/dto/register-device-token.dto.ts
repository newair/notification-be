import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'Application ID the device belongs to',
    example: 'app-12345',
  })
  @IsString()
  @IsNotEmpty()
  appId: string;

  @ApiProperty({
    description:
      'User ID owning the device (e.g. MongoDB _id from the User API)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'FCM device token obtained on the client',
    example: 'fcm-device-token-abc123',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({
    description: 'Platform of the device',
    enum: ['ios', 'android', 'web'],
    example: 'android',
  })
  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: string;
}

export class RegisterDeviceTokenResponseDto {
  @ApiProperty({ example: true })
  registered: boolean;
}
