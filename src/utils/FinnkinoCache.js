import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FinnkinoCache {
  constructor() {
    this.cacheDir = path.join(__dirname, '../../cache/finnkino');
    this.cacheTtl = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  /**
   * Generate cache key based on URL and parameters
   */
  generateCacheKey(url, params = {}) {
    const urlObj = new URL(url);
    
    // Combine URL search params with any additional params
    const allParams = new URLSearchParams(urlObj.search);
    Object.keys(params).forEach(key => {
      allParams.set(key, params[key]);
    });
    
    // Create a clean cache key
    const pathPart = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '_');
    const paramsPart = Array.from(allParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}_${value}`)
      .join('_');
    
    const cacheKey = paramsPart ? `${pathPart}_${paramsPart}.json` : `${pathPart}.json`;
    return cacheKey;
  }

  /**
   * Get cache file path
   */
  getCacheFilePath(cacheKey) {
    return path.join(this.cacheDir, cacheKey);
  }

  /**
   * Check if cache exists and is valid
   */
  async isCacheValid(cacheKey) {
    try {
      const filePath = this.getCacheFilePath(cacheKey);
      const stats = await fs.stat(filePath);
      const now = Date.now();
      const cacheAge = now - stats.mtime.getTime();
      
      return cacheAge < this.cacheTtl;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get data from cache
   */
  async getFromCache(cacheKey) {
    try {
      const filePath = this.getCacheFilePath(cacheKey);
      const isValid = await this.isCacheValid(cacheKey);
      
      if (!isValid) {
        console.log(`📂 Cache expired for key: ${cacheKey}`);
        return null;
      }

      const data = await fs.readFile(filePath, 'utf8');
      const cacheData = JSON.parse(data);
      
      console.log(`📂 Cache hit for key: ${cacheKey}`);
      return cacheData;
    } catch (error) {
      console.log(`📂 Cache miss for key: ${cacheKey}`);
      return null;
    }
  }

  /**
   * Save data to cache
   */
  async saveToCache(cacheKey, data) {
    try {
      // Ensure cache directory exists
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      const filePath = this.getCacheFilePath(cacheKey);
      const cacheData = {
        timestamp: Date.now(),
        data: data
      };
      
      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
      console.log(`💾 Data cached with key: ${cacheKey}`);
    } catch (error) {
      console.error(`❌ Failed to cache data for key ${cacheKey}:`, error.message);
    }
  }

  /**
   * Clear specific cache entry
   */
  async clearCache(cacheKey) {
    try {
      const filePath = this.getCacheFilePath(cacheKey);
      await fs.unlink(filePath);
      console.log(`🗑️ Cache cleared for key: ${cacheKey}`);
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAllCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const deletePromises = files
        .filter(file => file.endsWith('.json'))
        .map(file => fs.unlink(path.join(this.cacheDir, file)));
      
      await Promise.all(deletePromises);
      console.log(`🗑️ All Finnkino cache cleared (${files.length} files)`);
    } catch (error) {
      console.error('❌ Failed to clear cache:', error.message);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const stats = {
        totalFiles: jsonFiles.length,
        validFiles: 0,
        expiredFiles: 0,
        totalSize: 0
      };

      for (const file of jsonFiles) {
        const filePath = path.join(this.cacheDir, file);
        const fileStats = await fs.stat(filePath);
        stats.totalSize += fileStats.size;
        
        const cacheKey = file.replace('.json', '');
        if (await this.isCacheValid(cacheKey)) {
          stats.validFiles++;
        } else {
          stats.expiredFiles++;
        }
      }

      return stats;
    } catch (error) {
      return { totalFiles: 0, validFiles: 0, expiredFiles: 0, totalSize: 0 };
    }
  }
}

export default new FinnkinoCache();