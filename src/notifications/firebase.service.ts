import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Thin wrapper around the firebase-admin SDK.
 *
 * Credentials are resolved in order:
 * 1. FIREBASE_SERVICE_ACCOUNT       - inline service account JSON (raw or base64)
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH  - path to a service account JSON file
 * 3. GOOGLE_APPLICATION_CREDENTIALS - standard application default credentials
 *
 * When none are present the service boots normally but reports itself as not
 * configured, and send requests fail with a 400 ("Firebase is not configured").
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initialize();
  }

  private initialize(): void {
    const inline = this.configService.get<string>('firebase.serviceAccount');
    const filePath = this.configService.get<string>(
      'firebase.serviceAccountPath',
    );
    const projectId = this.configService.get<string>('firebase.projectId');

    try {
      let credential: admin.credential.Credential | null = null;

      if (inline) {
        credential = admin.credential.cert(this.parseServiceAccount(inline));
      } else if (filePath) {
        credential = admin.credential.cert(filePath);
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        credential = admin.credential.applicationDefault();
      }

      if (!credential) {
        this.logger.warn(
          'Firebase credentials not provided (FIREBASE_SERVICE_ACCOUNT / FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS). Push delivery is disabled.',
        );
        return;
      }

      this.app = admin.initializeApp({
        credential,
        ...(projectId ? { projectId } : {}),
      });
      this.logger.log('Firebase Admin initialized');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase Admin: ${error.message}`,
      );
      this.app = null;
    }
  }

  private parseServiceAccount(value: string): admin.ServiceAccount {
    const trimmed = value.trim();
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
    // Assume base64-encoded JSON.
    return JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
  }

  isConfigured(): boolean {
    return this.app !== null;
  }

  getMessaging(): admin.messaging.Messaging {
    return this.app.messaging();
  }
}
