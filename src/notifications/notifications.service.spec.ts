import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './firebase.service';
import { DeviceToken } from './schemas/device-token.schema';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const deviceTokenModel = {
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    deleteMany: jest.fn(),
  };

  const sendEachForMulticast = jest.fn();
  const firebaseService = {
    isConfigured: jest.fn(),
    getMessaging: jest.fn(() => ({ sendEachForMulticast })),
  };

  const mockFind = (devices: Array<{ token: string }>) => {
    deviceTokenModel.find.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve(devices) }),
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(DeviceToken.name),
          useValue: deviceTokenModel,
        },
        { provide: FirebaseService, useValue: firebaseService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('registerDeviceToken', () => {
    it('upserts the token and returns registered=true', async () => {
      deviceTokenModel.findOneAndUpdate.mockResolvedValue({});

      const result = await service.registerDeviceToken({
        appId: 'app-1',
        userId: 'user-1',
        token: 'token-1',
        platform: 'android',
      });

      expect(deviceTokenModel.findOneAndUpdate).toHaveBeenCalledWith(
        { token: 'token-1' },
        {
          appId: 'app-1',
          userId: 'user-1',
          token: 'token-1',
          platform: 'android',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      expect(result).toEqual({ registered: true });
    });

    it('omits platform when not provided', async () => {
      deviceTokenModel.findOneAndUpdate.mockResolvedValue({});

      await service.registerDeviceToken({
        appId: 'app-1',
        userId: 'user-1',
        token: 'token-1',
      });

      expect(deviceTokenModel.findOneAndUpdate).toHaveBeenCalledWith(
        { token: 'token-1' },
        { appId: 'app-1', userId: 'user-1', token: 'token-1' },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    });
  });

  describe('sendToUser', () => {
    it('throws 400 when no device tokens exist for the user and app', async () => {
      mockFind([]);

      await expect(
        service.sendToUser({ appId: 'app-1', userId: 'user-1' }),
      ).rejects.toThrow(
        new BadRequestException('No device tokens found for this user and app'),
      );
    });

    it('throws 400 when Firebase is not configured', async () => {
      mockFind([{ token: 'token-1' }]);
      firebaseService.isConfigured.mockReturnValue(false);

      await expect(
        service.sendToUser({ appId: 'app-1', userId: 'user-1' }),
      ).rejects.toThrow(new BadRequestException('Firebase is not configured'));
    });

    it('sends to all tokens and returns counts', async () => {
      mockFind([{ token: 'token-1' }, { token: 'token-2' }]);
      firebaseService.isConfigured.mockReturnValue(true);
      sendEachForMulticast.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [{ success: true }, { success: true }],
      });

      const result = await service.sendToUser({
        appId: 'app-1',
        userId: 'user-1',
        title: 'Hello',
        body: 'World',
        data: { screen: 'orders', id: '123' },
      });

      expect(sendEachForMulticast).toHaveBeenCalledWith({
        tokens: ['token-1', 'token-2'],
        notification: { title: 'Hello', body: 'World' },
        data: { screen: 'orders', id: '123' },
      });
      expect(result).toEqual({ sent: 2, failed: 0, invalidTokens: [] });
      expect(deviceTokenModel.deleteMany).not.toHaveBeenCalled();
    });

    it('removes invalid tokens and reports them', async () => {
      mockFind([{ token: 'token-1' }, { token: 'token-2' }]);
      firebaseService.isConfigured.mockReturnValue(true);
      sendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true },
          {
            success: false,
            error: {
              code: 'messaging/registration-token-not-registered',
              message: 'not registered',
            },
          },
        ],
      });
      deviceTokenModel.deleteMany.mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      const result = await service.sendToUser({
        appId: 'app-1',
        userId: 'user-1',
        title: 'Hello',
      });

      expect(result).toEqual({
        sent: 1,
        failed: 1,
        invalidTokens: ['token-2'],
      });
      expect(deviceTokenModel.deleteMany).toHaveBeenCalledWith({
        token: { $in: ['token-2'] },
      });
    });
  });
});
