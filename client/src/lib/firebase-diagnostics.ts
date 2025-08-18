import { storage, auth } from './firebase-storage';
import { ref, listAll } from 'firebase/storage';

/**
 * Comprehensive Firebase diagnostics
 */
export async function runFirebaseDiagnostics(): Promise<{
  config: any;
  connectivity: any;
  auth: any;
  storage: any;
  recommendations: string[];
}> {
  const results = {
    config: {},
    connectivity: {},
    auth: {},
    storage: {},
    recommendations: [] as string[]
  };

  // 1. Check Firebase configuration
  console.log('🔍 Checking Firebase configuration...');
  try {
    results.config = {
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      apiKeyPrefix: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
    };

    if (!results.config.hasApiKey) {
      results.recommendations.push('❌ VITE_FIREBASE_API_KEY مفقود في متغيرات البيئة');
    }
    if (!results.config.hasProjectId) {
      results.recommendations.push('❌ VITE_FIREBASE_PROJECT_ID مفقود في متغيرات البيئة');
    }
    if (!results.config.hasAppId) {
      results.recommendations.push('❌ VITE_FIREBASE_APP_ID مفقود في متغيرات البيئة');
    }
  } catch (error) {
    results.config.error = 'خطأ في قراءة إعدادات Firebase';
    results.recommendations.push('❌ فشل في قراءة إعدادات Firebase من متغيرات البيئة');
  }

  // 2. Check network connectivity to Firebase
  console.log('🌐 Testing Firebase connectivity...');
  try {
    const response = await fetch(`https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app/o`, {
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(5000)
    });
    
    results.connectivity = {
      reachable: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    };

    if (response.status === 403) {
      results.recommendations.push('⚠️ Firebase Storage يرفض الوصول - تحقق من Storage Rules');
    } else if (response.status === 404) {
      results.recommendations.push('❌ Firebase Storage Bucket غير موجود - تحقق من اسم المشروع');
    }
  } catch (error: any) {
    results.connectivity = {
      reachable: false,
      error: error.message
    };
    results.recommendations.push('❌ لا يمكن الوصول إلى Firebase Storage - تحقق من الإنترنت');
  }

  // 3. Check Firebase Auth status
  console.log('🔐 Checking Firebase Auth...');
  try {
    results.auth = {
      currentUser: auth.currentUser?.uid || 'غير مسجل دخول',
      authReady: true
    };
  } catch (error: any) {
    results.auth = {
      error: error.message,
      authReady: false
    };
    results.recommendations.push('❌ مشكلة في Firebase Authentication');
  }

  // 4. Test Firebase Storage permissions
  console.log('📁 Testing Storage permissions...');
  try {
    const testRef = ref(storage, 'test-permissions');
    await listAll(testRef);
    results.storage = {
      canList: true,
      permissionsOk: true
    };
  } catch (error: any) {
    results.storage = {
      canList: false,
      error: error.message,
      errorCode: error.code
    };
    
    if (error.code === 'storage/unauthorized') {
      results.recommendations.push('❌ Firebase Storage Rules تمنع الوصول - يجب تحديث القواعد');
    } else if (error.code === 'storage/invalid-argument') {
      results.recommendations.push('❌ خطأ في إعدادات Firebase Storage');
    } else {
      results.recommendations.push(`❌ خطأ غير معروف في Storage: ${error.code || error.message}`);
    }
  }

  // Generate final recommendations
  if (results.recommendations.length === 0) {
    results.recommendations.push('✅ جميع فحوصات Firebase نجحت - المشكلة قد تكون في الكود');
  }

  return results;
}

/**
 * Generate step-by-step fix instructions based on diagnostics
 */
export function generateFixInstructions(diagnostics: any): string[] {
  const instructions: string[] = [];
  
  if (!diagnostics.config.hasApiKey || !diagnostics.config.hasProjectId || !diagnostics.config.hasAppId) {
    instructions.push('1. تحقق من متغيرات البيئة في Replit:');
    instructions.push('   - افتح قسم "Environment variables" في Replit');
    instructions.push('   - تأكد من وجود: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID');
    instructions.push('   - احصل عليها من Firebase Console → Project Settings → General');
  }
  
  if (!diagnostics.connectivity.reachable) {
    instructions.push('2. مشكلة في الاتصال:');
    instructions.push('   - تحقق من اتصال الإنترنت');
    instructions.push('   - تأكد من أن اسم المشروع صحيح في VITE_FIREBASE_PROJECT_ID');
  }
  
  if (diagnostics.storage.errorCode === 'storage/unauthorized') {
    instructions.push('3. تحديث Storage Rules:');
    instructions.push('   - افتح Firebase Console');
    instructions.push('   - اذهب إلى Storage → Rules');
    instructions.push('   - استبدل القواعد بالقواعد المقترحة');
    instructions.push('   - اضغط "Publish"');
  }
  
  if (instructions.length === 0) {
    instructions.push('الفحوصات تبدو سليمة. جرب:');
    instructions.push('1. إعادة تحميل الصفحة');
    instructions.push('2. مسح cache المتصفح');
    instructions.push('3. استخدام ملف أصغر للاختبار');
  }
  
  return instructions;
}