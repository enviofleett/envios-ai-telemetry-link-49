
// Mock implementation since device_subscriptions table doesn't exist yet
import { DeviceSubscription, CreateSubscriptionRequest, UpdateSubscriptionRequest } from '@/types/billing';

export const deviceSubscriptionsApi = {
  async getDeviceSubscriptions(): Promise<DeviceSubscription[]> {
    // Return mock data since table doesn't exist
    return [];
  },

  async getDeviceSubscription(id: string): Promise<DeviceSubscription | null> {
    // Return mock data since table doesn't exist
    return null;
  },

  async getDeviceSubscriptionByDeviceId(deviceId: string): Promise<DeviceSubscription | null> {
    // Return mock data since table doesn't exist
    return null;
  },

  async createDeviceSubscription(subscription: CreateSubscriptionRequest): Promise<DeviceSubscription> {
    throw new Error('Device subscriptions table not yet implemented');
  },

  async updateDeviceSubscription(id: string, updates: UpdateSubscriptionRequest): Promise<DeviceSubscription> {
    throw new Error('Device subscriptions table not yet implemented');
  },

  async cancelDeviceSubscription(id: string): Promise<DeviceSubscription> {
    throw new Error('Device subscriptions table not yet implemented');
  },

  async renewDeviceSubscription(id: string, newEndDate: string): Promise<DeviceSubscription> {
    throw new Error('Device subscriptions table not yet implemented');
  }
};
