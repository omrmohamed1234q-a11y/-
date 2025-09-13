/**
 * خدمة الألوان والمظاهر المتقدمة للتطبيق
 * تدعم: Dark Mode، Custom Themes، Dynamic Colors، Accessibility
 */

// استيراد AsyncStorage
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
} catch (error) {
  AsyncStorage = {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    clear: () => Promise.resolve(localStorage.clear())
  };
}

class ThemeService {
  constructor() {
    this.currentTheme = 'light';
    this.customThemes = new Map();
    this.preferences = {
      followSystemTheme: true,
      highContrastMode: false,
      reduceAnimations: false,
      largeText: false
    };
    this.isInitialized = false;

    // معالجات الأحداث
    this.eventHandlers = {
      onThemeChanged: [],
      onPreferencesChanged: [],
      onCustomThemeAdded: []
    };

    // تعريف المظاهر المدمجة
    this.initializeBuiltInThemes();
  }

  /**
   * تعريف المظاهر المدمجة
   */
  initializeBuiltInThemes() {
    // المظهر الفاتح
    this.customThemes.set('light', {
      id: 'light',
      name: 'المظهر الفاتح',
      type: 'light',
      colors: {
        // Colors for light theme
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#8B5CF6',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        card: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          disabled: '#9CA3AF'
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6'
        },
        overlay: 'rgba(0, 0, 0, 0.5)',
        shadow: '#000000'
      },
      typography: {
        fontFamily: 'System',
        fontSize: {
          xs: 12,
          sm: 14,
          md: 16,
          lg: 18,
          xl: 20,
          xxl: 24
        },
        fontWeight: {
          light: '300',
          regular: '400',
          medium: '500',
          semiBold: '600',
          bold: '700'
        }
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 999
      }
    });

    // المظهر الداكن
    this.customThemes.set('dark', {
      id: 'dark',
      name: 'المظهر الداكن',
      type: 'dark',
      colors: {
        primary: '#60A5FA',
        secondary: '#34D399',
        accent: '#A78BFA',
        background: '#111827',
        surface: '#1F2937',
        card: '#374151',
        border: '#4B5563',
        text: {
          primary: '#F9FAFB',
          secondary: '#D1D5DB',
          disabled: '#6B7280'
        },
        status: {
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          info: '#60A5FA'
        },
        overlay: 'rgba(0, 0, 0, 0.7)',
        shadow: '#000000'
      },
      typography: {
        fontFamily: 'System',
        fontSize: {
          xs: 12,
          sm: 14,
          md: 16,
          lg: 18,
          xl: 20,
          xxl: 24
        },
        fontWeight: {
          light: '300',
          regular: '400',
          medium: '500',
          semiBold: '600',
          bold: '700'
        }
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 999
      }
    });

    // مظهر عالي التباين
    this.customThemes.set('high-contrast', {
      id: 'high-contrast',
      name: 'عالي التباين',
      type: 'high-contrast',
      colors: {
        primary: '#0000FF',
        secondary: '#00FF00',
        accent: '#FF00FF',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        border: '#000000',
        text: {
          primary: '#000000',
          secondary: '#000000',
          disabled: '#666666'
        },
        status: {
          success: '#00AA00',
          warning: '#FF8800',
          error: '#FF0000',
          info: '#0000AA'
        },
        overlay: 'rgba(0, 0, 0, 0.8)',
        shadow: '#000000'
      },
      typography: {
        fontFamily: 'System',
        fontSize: {
          xs: 14,
          sm: 16,
          md: 18,
          lg: 20,
          xl: 22,
          xxl: 26
        },
        fontWeight: {
          light: '400',
          regular: '500',
          medium: '600',
          semiBold: '700',
          bold: '800'
        }
      },
      spacing: {
        xs: 6,
        sm: 12,
        md: 20,
        lg: 28,
        xl: 36,
        xxl: 52
      },
      borderRadius: {
        sm: 2,
        md: 4,
        lg: 6,
        xl: 8,
        full: 999
      }
    });
  }

  /**
   * تهيئة خدمة المظاهر
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🎨 تهيئة خدمة المظاهر والألوان...');

      // تحميل التفضيلات المحفوظة
      await this.loadPreferences();

      // تحديد المظهر المناسب
      await this.determineInitialTheme();

      // مراقبة تغييرات النظام
      this.startSystemThemeMonitoring();

      this.isInitialized = true;
      console.log('✅ خدمة المظاهر جاهزة للعمل');

    } catch (error) {
      console.error('❌ خطأ في تهيئة خدمة المظاهر:', error);
    }
  }

  /**
   * تحديد المظهر الأولي
   */
  async determineInitialTheme() {
    try {
      // التحقق من التفضيلات المحفوظة
      const savedTheme = await AsyncStorage.getItem('selected_theme');
      
      if (savedTheme && this.customThemes.has(savedTheme)) {
        this.currentTheme = savedTheme;
      } else if (this.preferences.followSystemTheme) {
        // اتباع مظهر النظام
        const systemTheme = this.detectSystemTheme();
        this.currentTheme = systemTheme;
      } else {
        // المظهر الافتراضي
        this.currentTheme = 'light';
      }

      console.log(`🎨 Initial theme set: ${this.currentTheme}`);
    } catch (error) {
      console.error('❌ خطأ في تحديد المظهر الأولي:', error);
      this.currentTheme = 'light';
    }
  }

  /**
   * اكتشاف مظهر النظام
   */
  detectSystemTheme() {
    try {
      // Web environment
      if (typeof window !== 'undefined' && window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        return darkModeQuery.matches ? 'dark' : 'light';
      }

      // React Native environment
      // Note: Requires react-native-appearance or similar library
      // For now, default to light
      return 'light';
    } catch (error) {
      console.warn('⚠️ Cannot detect system theme:', error);
      return 'light';
    }
  }

  /**
   * مراقبة تغييرات مظهر النظام
   */
  startSystemThemeMonitoring() {
    try {
      // Web environment
      if (typeof window !== 'undefined' && window.matchMedia) {
        this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.systemThemeChangeHandler = (e) => {
          if (this.preferences.followSystemTheme) {
            const newTheme = e.matches ? 'dark' : 'light';
            this.switchTheme(newTheme);
          }
        };
        
        this.systemThemeQuery.addEventListener('change', this.systemThemeChangeHandler);
      }
    } catch (error) {
      console.warn('⚠️ Cannot monitor system theme changes:', error);
    }
  }

  /**
   * تبديل المظهر
   */
  async switchTheme(themeId) {
    try {
      if (!this.customThemes.has(themeId)) {
        console.error(`❌ Theme not found: ${themeId}`);
        return false;
      }

      const oldTheme = this.currentTheme;
      this.currentTheme = themeId;

      // حفظ التفضيل
      await AsyncStorage.setItem('selected_theme', themeId);

      console.log(`🎨 Theme switched: ${oldTheme} → ${themeId}`);

      // إشعار المعالجات
      this.notifyHandlers('onThemeChanged', {
        oldTheme,
        newTheme: themeId,
        theme: this.getTheme()
      });

      return true;
    } catch (error) {
      console.error('❌ خطأ في تبديل المظهر:', error);
      return false;
    }
  }

  /**
   * الحصول على المظهر الحالي
   */
  getTheme() {
    const theme = this.customThemes.get(this.currentTheme);
    
    // تطبيق تفضيلات إمكانية الوصول
    if (theme) {
      const adjustedTheme = { ...theme };
      
      // تكبير النص
      if (this.preferences.largeText) {
        adjustedTheme.typography = {
          ...adjustedTheme.typography,
          fontSize: {
            xs: adjustedTheme.typography.fontSize.xs + 2,
            sm: adjustedTheme.typography.fontSize.sm + 2,
            md: adjustedTheme.typography.fontSize.md + 2,
            lg: adjustedTheme.typography.fontSize.lg + 2,
            xl: adjustedTheme.typography.fontSize.xl + 2,
            xxl: adjustedTheme.typography.fontSize.xxl + 2
          }
        };
      }

      // تحسين التباين
      if (this.preferences.highContrastMode && theme.id !== 'high-contrast') {
        adjustedTheme.colors = {
          ...adjustedTheme.colors,
          border: theme.type === 'dark' ? '#FFFFFF' : '#000000',
          text: {
            primary: theme.type === 'dark' ? '#FFFFFF' : '#000000',
            secondary: theme.type === 'dark' ? '#E5E7EB' : '#374151',
            disabled: theme.type === 'dark' ? '#9CA3AF' : '#6B7280'
          }
        };
      }

      return adjustedTheme;
    }

    return this.customThemes.get('light'); // fallback
  }

  /**
   * إضافة مظهر مخصص
   */
  addCustomTheme(themeConfig) {
    try {
      if (!themeConfig.id || !themeConfig.name || !themeConfig.colors) {
        throw new Error('Theme config incomplete');
      }

      this.customThemes.set(themeConfig.id, themeConfig);
      
      console.log(`🎨 Custom theme added: ${themeConfig.name}`);
      
      this.notifyHandlers('onCustomThemeAdded', {
        themeId: themeConfig.id,
        themeName: themeConfig.name
      });

      return true;
    } catch (error) {
      console.error('❌ خطأ في إضافة المظهر المخصص:', error);
      return false;
    }
  }

  /**
   * الحصول على قائمة المظاهر المتاحة
   */
  getAvailableThemes() {
    return Array.from(this.customThemes.values()).map(theme => ({
      id: theme.id,
      name: theme.name,
      type: theme.type,
      preview: {
        background: theme.colors.background,
        surface: theme.colors.surface,
        primary: theme.colors.primary,
        text: theme.colors.text.primary
      }
    }));
  }

  /**
   * تحديث تفضيلات إمكانية الوصول
   */
  async updatePreferences(newPreferences) {
    try {
      const oldPreferences = { ...this.preferences };
      this.preferences = { ...this.preferences, ...newPreferences };

      // حفظ التفضيلات
      await AsyncStorage.setItem('theme_preferences', JSON.stringify(this.preferences));

      console.log('🎨 Theme preferences updated:', newPreferences);

      // إشعار المعالجات
      this.notifyHandlers('onPreferencesChanged', {
        oldPreferences,
        newPreferences: this.preferences
      });

      // إعادة تطبيق المظهر مع التفضيلات الجديدة
      this.notifyHandlers('onThemeChanged', {
        oldTheme: this.currentTheme,
        newTheme: this.currentTheme,
        theme: this.getTheme()
      });

      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث التفضيلات:', error);
      return false;
    }
  }

  /**
   * تحميل التفضيلات المحفوظة
   */
  async loadPreferences() {
    try {
      const saved = await AsyncStorage.getItem('theme_preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
        console.log('🎨 Loaded theme preferences:', this.preferences);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل التفضيلات:', error);
    }
  }

  /**
   * إنشاء مظهر بناءً على لون أساسي
   */
  generateThemeFromColor(primaryColor, themeName, themeType = 'light') {
    try {
      // تحويل اللون الأساسي إلى ألوان متدرجة
      const theme = {
        id: `custom_${Date.now()}`,
        name: themeName,
        type: themeType,
        colors: {
          primary: primaryColor,
          secondary: this.adjustColorBrightness(primaryColor, 20),
          accent: this.adjustColorHue(primaryColor, 60),
          background: themeType === 'dark' ? '#111827' : '#FFFFFF',
          surface: themeType === 'dark' ? '#1F2937' : '#F9FAFB',
          card: themeType === 'dark' ? '#374151' : '#FFFFFF',
          border: themeType === 'dark' ? '#4B5563' : '#E5E7EB',
          text: {
            primary: themeType === 'dark' ? '#F9FAFB' : '#111827',
            secondary: themeType === 'dark' ? '#D1D5DB' : '#6B7280',
            disabled: themeType === 'dark' ? '#6B7280' : '#9CA3AF'
          },
          status: {
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: primaryColor
          },
          overlay: themeType === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          shadow: '#000000'
        }
      };

      // استخدام المظهر الأساسي كقالب
      const baseTheme = this.customThemes.get(themeType === 'dark' ? 'dark' : 'light');
      const generatedTheme = {
        ...baseTheme,
        ...theme,
        colors: { ...baseTheme.colors, ...theme.colors }
      };

      return generatedTheme;
    } catch (error) {
      console.error('❌ خطأ في إنشاء المظهر:', error);
      return null;
    }
  }

  /**
   * تعديل إضاءة اللون
   */
  adjustColorBrightness(color, amount) {
    // تطبيق بسيط لتعديل الإضاءة
    // في بيئة إنتاج حقيقية، استخدم مكتبة مثل color أو chroma-js
    return color; // placeholder
  }

  /**
   * تعديل صبغة اللون
   */
  adjustColorHue(color, degrees) {
    // تطبيق بسيط لتعديل الصبغة
    return color; // placeholder
  }

  /**
   * الحصول على أسلوب StyleSheet للمظهر الحالي
   */
  createStyleSheet(styles) {
    const theme = this.getTheme();
    
    // تطبيق المظهر على الأنماط
    const themedStyles = {};
    
    for (const [key, style] of Object.entries(styles)) {
      themedStyles[key] = this.applyThemeToStyle(style, theme);
    }
    
    return themedStyles;
  }

  /**
   * تطبيق المظهر على نمط محدد
   */
  applyThemeToStyle(style, theme) {
    const themedStyle = { ...style };
    
    // استبدال المتغيرات بقيم المظهر
    for (const [property, value] of Object.entries(style)) {
      if (typeof value === 'string') {
        // استبدال متغيرات الألوان
        themedStyle[property] = value
          .replace(/\$primary/g, theme.colors.primary)
          .replace(/\$secondary/g, theme.colors.secondary)
          .replace(/\$background/g, theme.colors.background)
          .replace(/\$surface/g, theme.colors.surface)
          .replace(/\$text/g, theme.colors.text.primary)
          .replace(/\$border/g, theme.colors.border);
      }
    }
    
    return themedStyle;
  }

  /**
   * الحصول على تقرير حالة المظهر
   */
  getThemeStatus() {
    return {
      currentTheme: this.currentTheme,
      availableThemes: this.customThemes.size,
      preferences: this.preferences,
      isSystemThemeFollowed: this.preferences.followSystemTheme,
      isAccessibilityEnabled: this.preferences.highContrastMode || this.preferences.largeText
    };
  }

  /**
   * إضافة معالج أحداث
   */
  addEventListener(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  /**
   * إزالة معالج أحداث
   */
  removeEventListener(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  /**
   * إشعار المعالجات
   */
  notifyHandlers(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * إزالة جميع معالجات الأحداث
   */
  removeAllEventListeners() {
    try {
      // إزالة معالج تغيير مظهر النظام
      if (typeof window !== 'undefined' && window.matchMedia && this.systemThemeQuery) {
        this.systemThemeQuery.removeEventListener('change', this.systemThemeChangeHandler);
        this.systemThemeQuery = null;
        this.systemThemeChangeHandler = null;
      }

      // تنظيف جميع معالجات الأحداث الداخلية
      for (const event in this.eventHandlers) {
        this.eventHandlers[event] = [];
      }

      console.log('🧹 All ThemeService event listeners removed');
    } catch (error) {
      console.error('❌ Error removing ThemeService listeners:', error);
    }
  }

  /**
   * تنظيف الموارد
   */
  cleanup() {
    this.removeAllEventListeners();
    console.log('🧹 ThemeService cleaned up');
  }
}

// إنشاء نسخة وحيدة
const themeService = new ThemeService();

export default themeService;