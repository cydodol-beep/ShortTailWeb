import { supabase } from './supabase';
import { Category, Product } from '../types';

interface StoreSettingsData {
  store_logo: string | null;
  store_name: string | null;
}

interface StoreCatalogSnapshot {
  categories: Category[];
  products: Product[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes in-memory freshness

let storeSettingsCache: StoreSettingsData | null = null;
let storeSettingsPromise: Promise<StoreSettingsData> | null = null;
let catalogCache: StoreCatalogSnapshot | null = null;

export async function getStoreSettingsCached(forceRefresh = false): Promise<StoreSettingsData> {
  if (!forceRefresh && storeSettingsCache) {
    return storeSettingsCache;
  }
  if (!forceRefresh && storeSettingsPromise) {
    return storeSettingsPromise;
  }

  storeSettingsPromise = (async () => {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('store_logo, store_name')
        .limit(1)
        .maybeSingle();

      const result: StoreSettingsData = {
        store_logo: data?.store_logo || null,
        store_name: data?.store_name || null,
      };
      storeSettingsCache = result;
      return result;
    } catch {
      return storeSettingsCache || { store_logo: null, store_name: null };
    } finally {
      storeSettingsPromise = null;
    }
  })();

  return storeSettingsPromise;
}

export function getCatalogCache(): StoreCatalogSnapshot | null {
  if (!catalogCache) return null;
  if (Date.now() - catalogCache.fetchedAt > CACHE_TTL_MS) {
    return null;
  }
  return catalogCache;
}

export function setCatalogCache(categories: Category[], products: Product[]): void {
  catalogCache = {
    categories,
    products,
    fetchedAt: Date.now(),
  };
}

export function updateCatalogCacheProducts(products: Product[]): void {
  if (catalogCache) {
    catalogCache = {
      ...catalogCache,
      products,
    };
  }
}
