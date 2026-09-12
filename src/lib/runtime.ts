import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export type HostKind = 'iphone' | 'ipad' | 'android' | 'web';
export type RuntimeKind = 'expo-go' | 'dev-client' | 'standalone';

export type DeviceIdentity = {
  os: 'ios' | 'android' | 'web';
  host: HostKind;
  hostLabel: string;
  runtime: RuntimeKind;
  runtimeLabel: string;
  plate: string;
};

export function isExpoGo(): boolean {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

export function getDeviceIdentity(): DeviceIdentity {
  const os: DeviceIdentity['os'] =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  let host: HostKind = 'web';
  if (os === 'android') host = 'android';
  else if (os === 'ios') {
    const ios = Platform as { isPad?: boolean };
    host = ios.isPad ? 'ipad' : 'iphone';
  }

  const hostLabel = host === 'iphone' ? 'iPhone' : host === 'ipad' ? 'iPad' : host === 'android' ? 'Android' : 'Web';

  let runtime: RuntimeKind = 'standalone';
  if (isExpoGo()) runtime = 'expo-go';
  else if (Constants.executionEnvironment === ExecutionEnvironment.Bare) runtime = 'dev-client';

  const runtimeLabel =
    runtime === 'expo-go' ? 'Expo Go' : runtime === 'dev-client' ? 'Build de desarrollo' : 'App instalada';

  return {
    os,
    host,
    hostLabel,
    runtime,
    runtimeLabel,
    plate: `${hostLabel.toUpperCase()} · ${runtimeLabel.toUpperCase()}`,
  };
}

export function iosExpoGoBlocksBiometrics(): boolean {
  const id = getDeviceIdentity();
  return id.os === 'ios' && id.runtime === 'expo-go';
}
