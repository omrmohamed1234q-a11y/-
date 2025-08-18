// Firebase Connection Test Utilities

/**
 * Test Firebase Storage connectivity
 */
export async function testFirebaseStorageConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) {
      return {
        success: false,
        message: 'Firebase Project ID not configured'
      };
    }

    console.log('Testing Firebase Storage connectivity...');
    console.log('Project ID:', projectId);

    // Test basic connectivity to Firebase Storage API
    const testUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o`;
    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Firebase Storage connection successful',
        details: {
          status: response.status,
          bucket: `${projectId}.appspot.com`,
          itemCount: data?.items?.length || 0
        }
      };
    } else {
      return {
        success: false,
        message: `Firebase Storage returned ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Firebase Storage connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError'
      }
    };
  }
}

/**
 * Test Firebase configuration validity
 */
export function validateFirebaseConfig(): {
  valid: boolean;
  issues: string[];
  config: Record<string, any>;
} {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`
  };

  const issues: string[] = [];

  if (!config.apiKey) {
    issues.push('VITE_FIREBASE_API_KEY is missing');
  }
  if (!config.projectId) {
    issues.push('VITE_FIREBASE_PROJECT_ID is missing');
  }
  if (!config.appId) {
    issues.push('VITE_FIREBASE_APP_ID is missing');
  }

  return {
    valid: issues.length === 0,
    issues,
    config
  };
}

/**
 * Run comprehensive Firebase connectivity test
 */
export async function runFirebaseHealthCheck(): Promise<{
  overall: boolean;
  configCheck: ReturnType<typeof validateFirebaseConfig>;
  connectivityTest: Awaited<ReturnType<typeof testFirebaseStorageConnection>>;
}> {
  console.log('🔥 Running Firebase Health Check...');

  const configCheck = validateFirebaseConfig();
  console.log('Config validation:', configCheck);

  const connectivityTest = await testFirebaseStorageConnection();
  console.log('Connectivity test:', connectivityTest);

  const overall = configCheck.valid && connectivityTest.success;

  return {
    overall,
    configCheck,
    connectivityTest
  };
}