import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { isLockSuppressed, onLockSuppressChange } from '../lib/lockGate';

import {
  biometricErrorMessage,
  getBiometricProfile,
  promptDeviceAuth,
} from '../lib/biometrics';
import { generateVaultKeyHex } from '../lib/crypto';
import { autoLockMs } from '../lib/format';
import {
  factoryResetIfNeeded,
  isVaultInitialized,
  markVaultReady,
  readSettings,
  readVaultKey,
  saveSettings,
  saveVaultKey,
  wipeSecrets,
} from '../lib/secrets';
import {
  deleteItemFiles,
  destroyVaultFiles,
  ensureVaultLayout,
  ingestSource,
  isSealed,
  itemUri,
  loadCatalog,
  saveCatalog,
  verifyItemFingerprint,
} from '../lib/vault';
import {
  defaultSettings,
  emptyCatalog,
  type BiometricProfile,
  type Catalog,
  type Settings,
  type VaultItem,
} from '../types';

type SetupInput = {
  displayName: string;
};

type UnlockResult = { ok: true } | { ok: false; error: string };

type SessionValue = {
  hydrated: boolean;
  hasVault: boolean;
  unlocked: boolean;
  veil: boolean;
  settings: Settings;
  biometric: BiometricProfile;
  items: VaultItem[];
  setupVault: (input: SetupInput) => Promise<void>;
  unlockWithDevice: () => Promise<UnlockResult>;
  lock: () => void;
  confirmSensitive: (reason: string) => Promise<boolean>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  addFromSource: (input: {
    sourceUri: string;
    fileName: string;
    mimeType: string;
    kind?: VaultItem['kind'];
    title?: string;
    note?: string;
    sealedUntil?: number | null;
    origin?: VaultItem['origin'];
  }) => Promise<VaultItem>;
  updateItem: (id: string, patch: Partial<Pick<VaultItem, 'title' | 'note' | 'sealedUntil'>>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  fileUriFor: (item: VaultItem) => string;
  verifyItem: (item: VaultItem) => Promise<boolean>;
  destroyVault: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

const emptyBiometric = (): BiometricProfile => ({
  hasHardware: false,
  enrolled: false,
  kind: 'none',
  canAuth: false,
  biometricsUsable: false,
  hasDeviceSecret: false,
  label: 'código del teléfono',
  unlockLabel: 'Código del teléfono',
  blockedReason: null,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [veil, setVeil] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [biometric, setBiometric] = useState<BiometricProfile>(emptyBiometric);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog());

  const vaultKeyRef = useRef<string | null>(null);
  const catalogRef = useRef<Catalog>(emptyCatalog());
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockedRef = useRef(false);
  const settingsRef = useRef(settings);

  const commitCatalog = (next: Catalog) => {
    catalogRef.current = next;
    setCatalog(next);
  };

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const clearLockTimer = () => {
    if (lockTimer.current) {
      clearTimeout(lockTimer.current);
      lockTimer.current = null;
    }
  };

  const wipeMemory = useCallback(() => {
    vaultKeyRef.current = null;
    catalogRef.current = emptyCatalog();
    setCatalog(emptyCatalog());
    setUnlocked(false);
  }, []);

  const lock = useCallback(() => {
    clearLockTimer();
    wipeMemory();
    setVeil(false);
  }, [wipeMemory]);

  const hydrate = useCallback(async () => {
    await factoryResetIfNeeded();
    const [exists, storedSettings, profile] = await Promise.all([
      isVaultInitialized(),
      readSettings(),
      getBiometricProfile(),
    ]);
    setHasVault(exists);
    setSettings(storedSettings);
    setBiometric(profile);
    setHydrated(true);
  }, []);

  useEffect(() => {
    hydrate().catch(() => setHydrated(true));
  }, [hydrate]);

  useEffect(() => {
    const startLockCountdown = () => {
      if (!unlockedRef.current || isLockSuppressed()) return;
      const ms = autoLockMs(settingsRef.current.autoLock);
      clearLockTimer();
      if (ms === 0) {
        lock();
      } else {
        lockTimer.current = setTimeout(() => lock(), ms);
      }
    };

    const onChange = (next: AppStateStatus) => {
      if (next === 'inactive') {
        if (unlockedRef.current && settingsRef.current.privacyVeil && !isLockSuppressed()) {
          setVeil(true);
        }
        return;
      }
      if (next === 'background') {
        if (!unlockedRef.current) {
          setVeil(false);
          return;
        }
        if (isLockSuppressed()) return;
        if (settingsRef.current.privacyVeil) setVeil(true);
        startLockCountdown();
        return;
      }
      if (next === 'active') {
        setVeil(false);
        clearLockTimer();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    const unsubSuppress = onLockSuppressChange(() => {
      if (isLockSuppressed()) return;
      if (AppState.currentState === 'active') {
        setVeil(false);
        clearLockTimer();
        return;
      }
      if (AppState.currentState === 'background') {
        startLockCountdown();
      }
    });
    return () => {
      sub.remove();
      unsubSuppress();
      clearLockTimer();
    };
  }, [lock]);

  const openVault = useCallback(async () => {
    const key = await readVaultKey();
    if (!key) throw new Error('No se encontró la llave del archivo.');
    ensureVaultLayout();
    const loaded = await loadCatalog(key);
    vaultKeyRef.current = key;
    commitCatalog(loaded);
    setUnlocked(true);
  }, []);

  const setupVault = useCallback(async (input: SetupInput) => {
    const proved = await promptDeviceAuth('Confirma que eres tú para crear el archivo');
    if (!proved.ok) {
      throw new Error(biometricErrorMessage(proved.reason, 'el desbloqueo del teléfono'));
    }
    const keyHex = await generateVaultKeyHex();
    const nextSettings: Settings = {
      ...defaultSettings(),
      displayName: input.displayName.trim() || 'Archivo',
      biometricsEnabled: true,
    };
    await saveVaultKey(keyHex);
    await saveSettings(nextSettings);
    await markVaultReady();
    ensureVaultLayout();
    await saveCatalog(emptyCatalog(), keyHex);
    vaultKeyRef.current = keyHex;
    setSettings(nextSettings);
    commitCatalog(emptyCatalog());
    setHasVault(true);
    setUnlocked(true);
  }, []);

  const unlockWithDevice = useCallback(async (): Promise<UnlockResult> => {
    const result = await promptDeviceAuth(`Abre ${settingsRef.current.displayName}`);
    if (!result.ok) {
      const profile = await getBiometricProfile();
      setBiometric(profile);
      return { ok: false, error: biometricErrorMessage(result.reason, profile.unlockLabel) };
    }
    try {
      await openVault();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'No se pudo abrir el archivo.' };
    }
  }, [openVault]);

  const confirmSensitive = useCallback(async (reason: string) => {
    const result = await promptDeviceAuth(reason);
    return result.ok;
  }, []);

  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...partial };
    await saveSettings(next);
    setSettings(next);
  }, []);

  const requireKey = async () => {
    if (vaultKeyRef.current) return vaultKeyRef.current;
    const key = await readVaultKey();
    if (!key) throw new Error('El archivo está sellado. Ábrelo otra vez con el código del teléfono.');
    vaultKeyRef.current = key;
    if (catalogRef.current.items.length === 0) {
      const loaded = await loadCatalog(key);
      commitCatalog(loaded);
    }
    setUnlocked(true);
    return key;
  };

  const addFromSource = useCallback<SessionValue['addFromSource']>(async (input) => {
    const key = await requireKey();
    const { catalog: next, item } = await ingestSource({
      ...input,
      keyHex: key,
      catalog: catalogRef.current,
    });
    commitCatalog(next);
    return item;
  }, []);

  const updateItem = useCallback<SessionValue['updateItem']>(async (id, patch) => {
    const key = await requireKey();
    const nextItems = catalogRef.current.items.map((item) =>
      item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item,
    );
    const next = { version: 1 as const, items: nextItems };
    await saveCatalog(next, key);
    commitCatalog(next);
  }, []);

  const removeItem = useCallback(async (id: string) => {
    const key = await requireKey();
    const target = catalogRef.current.items.find((item) => item.id === id);
    const next = { version: 1 as const, items: catalogRef.current.items.filter((item) => item.id !== id) };
    await saveCatalog(next, key);
    if (target) deleteItemFiles(target);
    commitCatalog(next);
  }, []);

  const fileUriFor = useCallback((item: VaultItem) => itemUri(item), []);

  const verifyItem = useCallback(async (item: VaultItem) => verifyItemFingerprint(item), []);

  const destroyVault = useCallback(async () => {
    destroyVaultFiles();
    await wipeSecrets();
    wipeMemory();
    setHasVault(false);
    setSettings(defaultSettings());
  }, [wipeMemory]);

  const value = useMemo<SessionValue>(
    () => ({
      hydrated,
      hasVault,
      unlocked,
      veil,
      settings,
      biometric,
      items: catalog.items,
      setupVault,
      unlockWithDevice,
      lock,
      confirmSensitive,
      updateSettings,
      addFromSource,
      updateItem,
      removeItem,
      fileUriFor,
      verifyItem,
      destroyVault,
    }),
    [
      addFromSource,
      biometric,
      catalog.items,
      confirmSensitive,
      destroyVault,
      fileUriFor,
      hasVault,
      hydrated,
      lock,
      removeItem,
      settings,
      setupVault,
      unlockWithDevice,
      unlocked,
      updateItem,
      updateSettings,
      veil,
      verifyItem,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider');
  return ctx;
}

export { isSealed };
