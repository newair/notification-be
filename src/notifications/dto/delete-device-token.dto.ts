import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Delete a single token by its FCM token value. */
export class DeleteDeviceTokenDto {
  @ApiProperty({
    description: 'FCM device token to remove',
    example: 'fcm-device-token-abc123',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

/** Delete all tokens for a user within an app. */
export class DeleteUserDeviceTokensDto {
  @ApiProperty({
    description: 'Application ID to scope the deletion',
    example: 'app-12345',
  })
  @IsString()
  @IsNotEmpty()
  appId: string;

  @ApiProperty({
    description: 'User ID whose tokens should be removed',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description:
      'When provided, only the token matching this FCM value is removed (same as DELETE /device-token but scoped by user)',
    example: 'fcm-device-token-abc123',
  })
  @IsOptional()
  @IsString()
  token?: string;
}

export class DeleteDeviceTokenResponseDto {
  @ApiProperty({
    description: 'Number of token records removed',
    example: 1,
  })
  deleted: number;
}
