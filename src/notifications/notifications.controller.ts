import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  RegisterDeviceTokenDto,
  RegisterDeviceTokenResponseDto,
} from './dto/register-device-token.dto';
import {
  SendNotificationDto,
  SendNotificationResponseDto,
} from './dto/send-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device-token')
  @ApiOperation({
    summary: 'Register device token',
    description:
      'Register or update an FCM device token for a user of a given app. Re-registering the same token updates the record. Typically called at app initialization.',
  })
  @ApiCreatedResponse({
    description: 'Token registered successfully',
    type: RegisterDeviceTokenResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'appId, userId and token are required',
  })
  registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<RegisterDeviceTokenResponseDto> {
    return this.notificationsService.registerDeviceToken(dto);
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send push notification',
    description:
      'Send a push notification to all devices registered for the given user and app. Returns sent/failed counts and any invalid tokens (which are removed).',
  })
  @ApiOkResponse({
    description: 'Send result with sent/failed counts and invalid tokens',
    type: SendNotificationResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'appId and userId are required / no device tokens found / Firebase is not configured',
  })
  sendNotification(
    @Body() dto: SendNotificationDto,
  ): Promise<SendNotificationResponseDto> {
    return this.notificationsService.sendToUser(dto);
  }
}
