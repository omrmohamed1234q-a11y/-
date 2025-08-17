# Firebase Storage Security Rules

You need to configure your Firebase Storage security rules to allow file uploads. Go to your Firebase Console:

1. Open Firebase Console (console.firebase.google.com)
2. Select your project: **print-for-me-ea4a9**  
3. Go to Storage → Rules tab
4. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write access for authenticated and unauthenticated users
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**For production**, use more restrictive rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public files (uploads, camera-captures)
    match /{folder}/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
    
    // User-specific files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

After updating the rules, click **Publish** to apply them.