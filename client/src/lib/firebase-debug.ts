import { storage } from './firebase-storage';
import { ref, listAll } from 'firebase/storage';

export async function listFirebaseFiles(folderPath: string = '') {
  try {
    console.log('Listing files in Firebase Storage folder:', folderPath);
    
    const listRef = ref(storage, folderPath);
    const result = await listAll(listRef);
    
    console.log('Files found:');
    result.items.forEach((itemRef) => {
      console.log('- File:', itemRef.fullPath);
    });
    
    console.log('Folders found:');
    result.prefixes.forEach((folderRef) => {
      console.log('- Folder:', folderRef.fullPath);
    });
    
    return {
      files: result.items.map(item => item.fullPath),
      folders: result.prefixes.map(folder => folder.fullPath)
    };
  } catch (error) {
    console.error('Error listing Firebase Storage files:', error);
    throw error;
  }
}

// Add this function to test Firebase Storage visibility
export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase Storage connection...');
    const result = await listFirebaseFiles('uploads');
    console.log('✓ Firebase Storage is accessible');
    return result;
  } catch (error) {
    console.error('✗ Firebase Storage connection failed:', error);
    throw error;
  }
}