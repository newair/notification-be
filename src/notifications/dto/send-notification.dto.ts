import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({
    description: 'Application ID to scope the delivery',
    example: 'app-12345',
  })
  @IsString()
  @IsNotEmpty()
  appId: string;

  @ApiProperty({
    description: 'User ID to send the notification to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Notification title',
    example: 'New order received',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Notification body',
    example: 'Order #123 is ready for pickup',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'Optional key-value data payload (values are sent as strings)',
    example: { screen: 'orders', id: '123' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}

export class SendNotificationResponseDto {
  @ApiProperty({
    description: 'Number of messages sent successfully',
    example: 2,
  })
  sent: number;

  @ApiProperty({ description: 'Number of send failures', example: 0 })
  failed: number;

  @ApiProperty({
    description: 'Tokens that were invalid or unregistered (and removed)',
    type: [String],
    example: [],
  })
  invalidTokens: string[];
}
