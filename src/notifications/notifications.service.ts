import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeviceToken,
  DeviceTokenDocument,
} from './schemas/device-token.schema';
import { FirebaseService } from './firebase.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import {
  SendNotificationDto,
  SendNotificationResponseDto,
} from './dto/send-notification.dto';

// FCM error codes that mean the token is dead and should be removed.
const INVALID_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(DeviceToken.name)
    private readonly deviceTokenModel: Model<DeviceTokenDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async registerDeviceToken(
    dto: RegisterDeviceTokenDto,
  ): Promise<{ registered: boolean }> {
    const { appId, userId, token, platform } = dto;

    // Upsert by token: a device token is globally unique, so re-registering
    // the same token (possibly after the device switched user/app) updates
    // the existing record instead of creating duplicates.
    await this.deviceTokenModel.findOneAndUpdate(
      { token },
      { appId, userId, token, ...(platform ? { platform } : {}) },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    this.logger.log(
      `Registered device token for appId=${appId} userId=${userId}`,
    );
    return { registered: true };
  }

  async sendToUser(
    dto: SendNotificationDto,
  ): Promise<SendNotificationResponseDto> {
    const { appId, userId, title, body, data } = dto;

    const devices = await this.deviceTokenModel
      .find({ appId, userId })
      .lean()
      .exec();

    if (!devices.length) {
      throw new BadRequestException(
        'No device tokens found for this user and app',
      );
    }

    if (!this.firebaseService.isConfigured()) {
      throw new BadRequestException('Firebase is not configured');
    }

    const tokens = devices.map((device) => device.token);
    const stringData = this.toStringRecord(data);

    const response = await this.firebaseService
      .getMessaging()
      .sendEachForMulticast({
        tokens,
        ...(title || body
          ? {
              notification: {
                ...(title ? { title } : {}),
                ...(body ? { body } : {}),
              },
            }
          : {}),
        ...(stringData ? { data: stringData } : {}),
      });

    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const code = result.error?.code;
        this.logger.warn(
          `Failed to send to token[${index}]: ${code} - ${result.error?.message}`,
        );
        if (code && INVALID_TOKEN_ERROR_CODES.has(code)) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length) {
      await this.deviceTokenModel
        .deleteMany({ token: { $in: invalidTokens } })
        .exec();
      this.logger.log(
        `Removed ${invalidTokens.length} invalid device token(s)`,
      );
    }

    return {
      sent: response.successCount,
      failed: response.failureCount,
      invalidTokens,
    };
  }

  private toStringRecord(
    data?: Record<string, unknown>,
  ): Record<string, string> | undefined {
    if (!data || !Object.keys(data).length) {
      return undefined;
    }
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)]),
    );
  }
}
