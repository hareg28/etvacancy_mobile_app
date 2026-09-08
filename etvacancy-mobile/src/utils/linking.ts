import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

export async function openUrl(url: string, _inApp = false): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

export async function openEmail(email: string, subject?: string, body?: string): Promise<void> {
  let url = `mailto:${email}`;
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString();
  if (query) url += `?${query}`;
  await Linking.openURL(url);
}

export async function openPhone(phone: string): Promise<void> {
  await Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

export async function openSms(phone: string, body?: string): Promise<void> {
  let url = `sms:${phone.replace(/\s/g, '')}`;
  if (body) url += `?body=${encodeURIComponent(body)}`;
  await Linking.openURL(url);
}

export function shareUrl(url: string, message?: string): string {
  return message ? `${message}\n${url}` : url;
}

export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

export function isWeb(): boolean {
  return Platform.OS === 'web';
}
