import type { BiometricProfile } from '../types';
import { DevicePlate } from './DevicePlate';

/** @deprecated Use DevicePlate. Kept so older screens keep compiling. */
export function ExpoGoNotice({ biometric }: { biometric?: BiometricProfile }) {
  return <DevicePlate biometric={biometric} />;
}
