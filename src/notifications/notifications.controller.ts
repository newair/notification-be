import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
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
import {
  DeleteDeviceTokenDto,
  DeleteDeviceTokenResponseDto,
  DeleteUserDeviceTokensDto,
} from './dto/delete-device-token.dto';

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

  @Delete('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a device token',
    description:
      'Remove a single FCM device token by its token value. Use this on sign-out or when the client detects the token has been revoked.',
  })
  @ApiOkResponse({
    description: 'Number of records removed (0 if token was not found)',
    type: DeleteDeviceTokenResponseDto,
  })
  @ApiBadRequestResponse({ description: 'token is required' })
  deleteDeviceToken(
    @Body() dto: DeleteDeviceTokenDto,
  ): Promise<DeleteDeviceTokenResponseDto> {
    return this.notificationsService.deleteDeviceToken(dto);
  }

  @Delete('device-tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete device tokens for a user',
    description:
      'Remove all FCM device tokens for a given user and app. Optionally scope the deletion to a single token by including the `token` field. Useful for sign-out-all-devices flows or account deletion.',
  })
  @ApiOkResponse({
    description: 'Number of records removed',
    type: DeleteDeviceTokenResponseDto,
  })
  @ApiNotFoundResponse({ description: 'No tokens found for this user and app' })
  @ApiBadRequestResponse({ description: 'appId and userId are required' })
  deleteUserDeviceTokens(
    @Body() dto: DeleteUserDeviceTokensDto,
  ): Promise<DeleteDeviceTokenResponseDto> {
    return this.notificationsService.deleteUserDeviceTokens(dto);
  }
}
