import { ImageConfig, DEFAULT_CONFIG } from "../types/config";

const STORAGE_KEY = "metastamp-config";
const CONFIG_VERSION = 1;

interface StoredConfig {
  version: number;
  config: ImageConfig;
}

export function loadConfig(): ImageConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_CONFIG;
    }
    
    const parsed: StoredConfig = JSON.parse(stored);
    
    // Handle version migrations if needed
    if (parsed.version !== CONFIG_VERSION) {
      // Future migration logic here
      return migrateConfig(parsed);
    }
    
    // Merge with defaults to handle any new fields
    return {
      ...DEFAULT_CONFIG,
      ...parsed.config,
    };
  } catch (error) {
    console.warn("Failed to load config from localStorage:", error);
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: ImageConfig): void {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    const toStore: StoredConfig = {
      version: CONFIG_VERSION,
      config,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.warn("Failed to save config to localStorage:", error);
  }
}

export function clearConfig(): void {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear config from localStorage:", error);
  }
}

function migrateConfig(stored: StoredConfig): ImageConfig {
  // Handle migrations from older versions
  // For now, just merge with defaults
  return {
    ...DEFAULT_CONFIG,
    ...stored.config,
  };
}

// Debounced save function
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function debouncedSaveConfig(config: ImageConfig, delay = 300): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveConfig(config);
    saveTimeout = null;
  }, delay);
}
