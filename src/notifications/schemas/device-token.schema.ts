import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceTokenDocument = DeviceToken & Document;

@Schema({ timestamps: true, collection: 'device_tokens' })
export class DeviceToken {
  @Prop({ required: true, index: true })
  appId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ enum: ['ios', 'android', 'web'], required: false })
  platform?: string;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

// Fast lookup of all devices for a user within an app.
DeviceTokenSchema.index({ appId: 1, userId: 1 });
