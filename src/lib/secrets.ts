import * as SecureStore from 'expo-secure-store';

import { defaultSettings, type Settings } from '../types';
import { destroyVaultFiles } from './vault';

/** Bump this to wipe local vaults once after a breaking storage change. */
const STORAGE_GEN = '2026-09-11-c';

const KEYS = {
  pinHash: 'sigillum.pin.hash',
  pinSalt: 'sigillum.pin.salt',
  vaultKey: 'sigillum.aes.key',
  settings: 'sigillum.settings',
  ready: 'sigillum.ready',
  storageGen: 'sigillum.storage.gen',
} as const;

const storeOpts: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function factoryResetIfNeeded(): Promise<boolean> {
  const gen = await SecureStore.getItemAsync(KEYS.storageGen, storeOpts);
  if (gen === STORAGE_GEN) return false;
  try {
    destroyVaultFiles();
  } catch {
    // ignore missing dirs
  }
  await wipeSecrets();
  await SecureStore.setItemAsync(KEYS.storageGen, STORAGE_GEN, storeOpts);
  return true;
}

export async function isVaultInitialized(): Promise<boolean> {
  const [key, ready, hash] = await Promise.all([
    SecureStore.getItemAsync(KEYS.vaultKey, storeOpts),
    SecureStore.getItemAsync(KEYS.ready, storeOpts),
    SecureStore.getItemAsync(KEYS.pinHash, storeOpts),
  ]);
  return Boolean(key || ready || hash);
}

export async function markVaultReady(): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ready, '1', storeOpts);
}

export async function saveVaultKey(keyHex: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.vaultKey, keyHex, storeOpts);
}

export async function readVaultKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.vaultKey, storeOpts);
}

export async function readSettings(): Promise<Settings> {
  const raw = await SecureStore.getItemAsync(KEYS.settings, storeOpts);
  if (!raw) return defaultSettings();
  try {
    return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await SecureStore.setItemAsync(KEYS.settings, JSON.stringify(settings), storeOpts);
}

export async function wipeSecrets(): Promise<void> {
  const ephemeral = Object.values(KEYS).filter((key) => key !== KEYS.storageGen);
  await Promise.all(ephemeral.map((key) => SecureStore.deleteItemAsync(key, storeOpts).catch(() => undefined)));
}
