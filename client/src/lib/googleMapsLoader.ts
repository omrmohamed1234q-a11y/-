/**
 * Google Maps API Loader - Secure and Lazy Loading
 * اطبعلي - Google Maps Integration
 */

import { useState, useCallback } from 'react';

// Google Maps types declaration
declare global {
  interface Window {
    google: {
      maps: any;
    };
  }
}

interface GoogleMapsLoaderOptions {
  libraries?: string[];
  language?: string;
  region?: string;
  callback?: string;
}

interface GoogleMapsLoadResult {
  success: boolean;
  error?: string;
  api?: typeof google.maps;
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoading = false;
  private isLoaded = false;
  private loadPromise: Promise<GoogleMapsLoadResult> | null = null;
  private apiKey: string;

  private constructor() {
    // Get API key from environment variable (secure approach)
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!this.apiKey) {
      console.error('❌ VITE_GOOGLE_MAPS_API_KEY not configured');
      throw new Error('Google Maps API key not configured');
    }
  }

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  /**
   * Load Google Maps API with lazy loading approach
   */
  async loadGoogleMaps(options: GoogleMapsLoaderOptions = {}): Promise<GoogleMapsLoadResult> {
    // If already loaded, return immediately
    if (this.isLoaded && window.google && window.google.maps) {
      return {
        success: true,
        api: window.google.maps
      };
    }

    // If already loading, return existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.loadGoogleMapsScript(options);

    return this.loadPromise;
  }

  private async loadGoogleMapsScript(options: GoogleMapsLoaderOptions): Promise<GoogleMapsLoadResult> {
    return new Promise((resolve) => {
      try {
        console.log('🗺️ Loading Google Maps API (lazy)...');

        // Create callback function name
        const callbackName = `googleMapsCallback_${Date.now()}`;
        
        // Setup callback function
        (window as any)[callbackName] = () => {
          try {
            console.log('✅ Google Maps API loaded successfully');
            
            // Validate API availability
            if (!window.google || !window.google.maps) {
              throw new Error('Google Maps API not properly initialized');
            }

            this.isLoaded = true;
            this.isLoading = false;
            
            // Cleanup callback
            delete (window as any)[callbackName];
            
            resolve({
              success: true,
              api: window.google.maps
            });
          } catch (error) {
            console.error('❌ Google Maps callback error:', error);
            this.isLoading = false;
            
            // Cleanup callback
            delete (window as any)[callbackName];
            
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown callback error'
            });
          }
        };

        // Build script URL
        const params = new URLSearchParams({
          key: this.apiKey,
          callback: callbackName,
          libraries: options.libraries?.join(',') || 'places',
          language: options.language || 'ar',
          region: options.region || 'EG',
          loading: 'async'
        });

        const scriptUrl = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

        // Create and load script
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;

        // Error handling
        script.onerror = () => {
          console.error('❌ Failed to load Google Maps script');
          this.isLoading = false;
          
          // Cleanup callback
          delete (window as any)[callbackName];
          
          resolve({
            success: false,
            error: 'Failed to load Google Maps script'
          });
        };

        // Load timeout (20 seconds)
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Google Maps loading timeout (20s)');
          this.isLoading = false;
          
          // Cleanup callback
          delete (window as any)[callbackName];
          
          resolve({
            success: false,
            error: 'Google Maps loading timeout'
          });
        }, 20000);

        // Clear timeout when script loads
        script.onload = () => {
          console.log('📜 Google Maps script loaded, waiting for callback...');
          clearTimeout(timeoutId);
        };

        // Append script to head
        document.head.appendChild(script);

      } catch (error) {
        console.error('❌ Google Maps loader error:', error);
        this.isLoading = false;
        
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown loader error'
        });
      }
    });
  }

  /**
   * Check if Google Maps is currently loaded
   */
  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!window.google && !!window.google.maps;
  }

  /**
   * Get Google Maps API if loaded
   */
  getGoogleMapsAPI(): typeof google.maps | null {
    return this.isGoogleMapsLoaded() ? window.google.maps : null;
  }
}

// Export singleton instance
export const googleMapsLoader = GoogleMapsLoader.getInstance();

// Export types for components
export type { GoogleMapsLoaderOptions, GoogleMapsLoadResult };

// Hook for React components
export function useGoogleMaps(options?: GoogleMapsLoaderOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<typeof google.maps | null>(null);

  const loadMaps = useCallback(async () => {
    if (googleMapsLoader.isGoogleMapsLoaded()) {
      setIsLoaded(true);
      setApi(googleMapsLoader.getGoogleMapsAPI());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await googleMapsLoader.loadGoogleMaps(options);
      
      if (result.success) {
        setIsLoaded(true);
        setApi(result.api || null);
      } else {
        setError(result.error || 'Failed to load Google Maps');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    isLoaded,
    isLoading,
    error,
    api,
    loadMaps
  };
}