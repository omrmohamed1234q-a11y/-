// Firebase Debug and Testing Utilities
import { runFirebaseHealthCheck } from './firebase-connectivity';
import { testCloudinaryConnection } from './cloudinary';
import { checkUploadServiceStatus } from './upload-service';

// Make Firebase test functions available globally for console testing
declare global {
  interface Window {
    testFirebaseConnection: () => Promise<void>;
    checkFirebaseConfig: () => void;
    runFirebaseHealthCheck: () => Promise<any>;
    testCloudinaryConnection: () => Promise<void>;
    checkUploadServiceStatus: () => Promise<void>;
    testServerConnection: () => Promise<any>;
  }
}

export function initFirebaseDebugTools() {
  // Test Firebase Storage connection
  window.testFirebaseConnection = async () => {
    console.log('🔥 Testing Firebase Storage Connection...');
    
    try {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const testUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o`;
      
      console.log('Testing URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Firebase Storage connection successful!');
        console.log('Response:', data);
        console.log('Storage bucket:', `${projectId}.appspot.com`);
        console.log('Files in bucket:', data?.items?.length || 0);
      } else {
        console.error('❌ Firebase Storage connection failed');
        console.error('Status:', response.status, response.statusText);
        
        if (response.status === 403) {
          console.error('🔒 Access denied - check Firebase Storage rules');
        }
      }
    } catch (error) {
      console.error('❌ Firebase connection error:', error);
    }
  };

  // Check Firebase configuration
  window.checkFirebaseConfig = () => {
    console.log('🔥 Firebase Configuration Check...');
    
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing',
      appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`
    };
    
    console.table(config);
    
    if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      console.log('🔗 Firebase Console Link:');
      console.log(`https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/storage`);
    }
  };

  // Run comprehensive health check
  window.runFirebaseHealthCheck = async () => {
    const result = await runFirebaseHealthCheck();
    
    if (result.overall) {
      console.log('✅ Firebase is properly configured and accessible!');
    } else {
      console.log('❌ Firebase has issues:');
      if (!result.configCheck.valid) {
        console.log('Config issues:', result.configCheck.issues);
      }
      if (!result.connectivityTest.success) {
        console.log('Connection issue:', result.connectivityTest.message);
      }
    }
    
    return result;
  };

  // Test Cloudinary connection
  window.testCloudinaryConnection = async () => {
    console.log('🟡 Testing Cloudinary Connection...');
    const result = await testCloudinaryConnection();
    
    if (result.success) {
      console.log('✅ Cloudinary connection successful!');
      console.log('Details:', result.details);
    } else {
      console.error('❌ Cloudinary connection failed:', result.message);
      console.log('Details:', result.details);
    }
  };

  // Check all upload services
  window.checkUploadServiceStatus = async () => {
    console.log('🔍 Checking Upload Services Status...');
    const status = await checkUploadServiceStatus();
    
    console.log('=== Upload Services Status ===');
    console.log('Cloudinary:', status.cloudinary);
    console.log('Firebase:', status.firebase);
    console.log('Recommended:', status.recommended);
    
    if (status.recommended === 'none') {
      console.warn('⚠️ No upload service is properly configured!');
    } else {
      console.log(`✅ Recommended service: ${status.recommended}`);
    }
  };

  // Test server connection
  window.testServerConnection = async () => {
    console.log('🌐 Testing server connection...');
    try {
      const response = await fetch('/api/upload-status');
      const data = await response.json();
      console.log('✅ Server response:', data);
      return data;
    } catch (error) {
      console.error('❌ Server connection failed:', error);
      throw error;
    }
  };

  console.log('🔥 Firebase debug tools loaded!');
  console.log('Available commands:');
  console.log('- testFirebaseConnection()');
  console.log('- checkFirebaseConfig()');
  console.log('- runFirebaseHealthCheck()');
  console.log('- testCloudinaryConnection()');
  console.log('- checkUploadServiceStatus()');
  console.log('- testServerConnection()');
}