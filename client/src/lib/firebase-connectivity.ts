/**
 * Firebase connectivity and diagnostics utilities
 */

export async function testFirebaseConnectivity(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity to Firebase Storage
    const response = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app/o`,
      {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    );
    
    const latency = Date.now() - startTime;
    
    if (response.ok || response.status === 401) {
      // 401 is expected for unauthenticated requests, but means Firebase is reachable
      return { connected: true, latency };
    } else {
      return { 
        connected: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error: any) {
    console.error('Firebase connectivity test failed:', error);
    
    if (error.name === 'TimeoutError') {
      return { 
        connected: false, 
        error: 'انتهت مهلة الاتصال بـ Firebase (اتصال بطيء)' 
      };
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { 
        connected: false, 
        error: 'فشل في الاتصال بـ Firebase (تحقق من الإنترنت)' 
      };
    } else {
      return { 
        connected: false, 
        error: `خطأ في الاتصال: ${error.message}` 
      };
    }
  }
}

export async function diagnoseProblem(file: File): Promise<{
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
}> {
  const recommendations: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';
  
  // Check file size
  if (file.size > 5 * 1024 * 1024) { // > 5MB
    recommendations.push('الملف كبير جداً (أكثر من 5 ميجابايت). جرب ضغط الملف أو تقسيمه');
    severity = 'high';
  } else if (file.size > 2 * 1024 * 1024) { // > 2MB
    recommendations.push('الملف كبير نسبياً. قد يستغرق وقتاً أطول للرفع');
    severity = 'medium';
  }
  
  // Check file type
  const isPDF = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  
  if (isPDF && file.size > 1024 * 1024) { // PDF > 1MB
    recommendations.push('ملف PDF كبير. جرب ضغطه باستخدام أدوات ضغط PDF أونلاين');
  }
  
  if (isImage && file.size > 500 * 1024) { // Image > 500KB
    recommendations.push('صورة كبيرة. جرب تقليل الدقة أو الجودة');
  }
  
  // Test connectivity
  const connectivity = await testFirebaseConnectivity();
  if (!connectivity.connected) {
    recommendations.push(`مشكلة في الاتصال: ${connectivity.error}`);
    severity = 'high';
  } else if (connectivity.latency && connectivity.latency > 3000) {
    recommendations.push('الاتصال بطيء. قد تحتاج إلى صبر أكثر أو ملف أصغر');
    if (severity !== 'high') severity = 'medium';
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('جرب إعادة الرفع أو إعادة تحميل الصفحة');
  }
  
  return { recommendations, severity };
}

export function getOptimalChunkSize(fileSize: number): number {
  // Calculate optimal chunk size based on file size
  if (fileSize < 1024 * 1024) { // < 1MB
    return 256 * 1024; // 256KB chunks
  } else if (fileSize < 10 * 1024 * 1024) { // < 10MB
    return 512 * 1024; // 512KB chunks
  } else {
    return 1024 * 1024; // 1MB chunks
  }
}