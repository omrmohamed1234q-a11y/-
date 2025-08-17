import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { uploadToFirebaseStorage } from '../services/firebaseStorage';

interface PrintScreenProps {
  navigation: any;
  route?: {
    params?: {
      imageUri?: string;
    };
  };
}

export default function PrintScreen({ navigation, route }: PrintScreenProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    colorMode: 'grayscale',
    paperSize: 'A4',
    doubleSided: false,
  });
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (route?.params?.imageUri) {
      setSelectedFile({
        name: 'captured_image.jpg',
        uri: route.params.imageUri,
        size: 0,
        type: 'image/jpeg',
      });
    }
  }, [route?.params?.imageUri]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('خطأ', 'فشل في اختيار الملف');
    }
  };

  const handlePrint = async () => {
    if (!selectedFile || !user) {
      Alert.alert('تنبيه', 'يرجى اختيار ملف أولاً');
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Firebase if it's a local file
      let fileUrl = selectedFile.uri;
      if (!selectedFile.uri.startsWith('http')) {
        fileUrl = await uploadToFirebaseStorage(selectedFile.uri, 'print-jobs');
      }

      // Create print job
      const printJob = {
        fileUrl,
        fileName: selectedFile.name,
        settings: printSettings,
        userId: user.uid,
        timestamp: new Date().toISOString(),
      };

      console.log('Print job created:', printJob);

      Alert.alert(
        'تم إرسال الطلب',
        'سيتم طباعة مستندك قريباً. ستصلك رسالة تأكيد.',
        [
          {
            text: 'الدفع الآن',
            onPress: () => navigation.navigate('Payment', { printJob }),
          },
          { text: 'حسناً', style: 'default' },
        ]
      );

      setSelectedFile(null);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('خطأ', 'فشل في إرسال طلب الطباعة');
    } finally {
      setIsUploading(false);
    }
  };

  const calculateCost = () => {
    if (!selectedFile) return 0;
    const basePrice = printSettings.colorMode === 'color' ? 2 : 1;
    const pages = 5; // Mock page count
    return pages * printSettings.copies * basePrice;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color="#dc2626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>خدمة الطباعة</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* File Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اختيار الملف</Text>
          
          {selectedFile ? (
            <View style={styles.fileCard}>
              <View style={styles.fileInfo}>
                <Ionicons name="document" size={32} color="#dc2626" />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {selectedFile.size ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'صورة ملتقطة'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setSelectedFile(null)}
              >
                <Ionicons name="close" size={20} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Ionicons name="cloud-upload" size={32} color="#6b7280" />
              <Text style={styles.uploadText}>اختر ملف للطباعة</Text>
              <Text style={styles.uploadSubtext}>PDF, Word, صور</Text>
            </TouchableOpacity>
          )}

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Camera')}
            >
              <Ionicons name="camera" size={20} color="#dc2626" />
              <Text style={styles.actionText}>التقط صورة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Print Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات الطباعة</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>عدد النسخ</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setPrintSettings(prev => ({ 
                  ...prev, 
                  copies: Math.max(1, prev.copies - 1) 
                }))}
              >
                <Ionicons name="remove" size={16} color="#dc2626" />
              </TouchableOpacity>
              <Text style={styles.counterText}>{printSettings.copies}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setPrintSettings(prev => ({ 
                  ...prev, 
                  copies: Math.min(10, prev.copies + 1) 
                }))}
              >
                <Ionicons name="add" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>نوع الطباعة</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  printSettings.colorMode === 'grayscale' && styles.toggleButtonActive
                ]}
                onPress={() => setPrintSettings(prev => ({ ...prev, colorMode: 'grayscale' }))}
              >
                <Text style={[
                  styles.toggleText,
                  printSettings.colorMode === 'grayscale' && styles.toggleTextActive
                ]}>أبيض وأسود</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  printSettings.colorMode === 'color' && styles.toggleButtonActive
                ]}
                onPress={() => setPrintSettings(prev => ({ ...prev, colorMode: 'color' }))}
              >
                <Text style={[
                  styles.toggleText,
                  printSettings.colorMode === 'color' && styles.toggleTextActive
                ]}>ملون</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>حجم الورق</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  printSettings.paperSize === 'A4' && styles.toggleButtonActive
                ]}
                onPress={() => setPrintSettings(prev => ({ ...prev, paperSize: 'A4' }))}
              >
                <Text style={[
                  styles.toggleText,
                  printSettings.paperSize === 'A4' && styles.toggleTextActive
                ]}>A4</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  printSettings.paperSize === 'A3' && styles.toggleButtonActive
                ]}
                onPress={() => setPrintSettings(prev => ({ ...prev, paperSize: 'A3' }))}
              >
                <Text style={[
                  styles.toggleText,
                  printSettings.paperSize === 'A3' && styles.toggleTextActive
                ]}>A3</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخص التكلفة</Text>
          <View style={styles.costCard}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>التكلفة الإجمالية</Text>
              <Text style={styles.costValue}>{calculateCost().toFixed(2)} ج.م</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.printButton, (!selectedFile || isUploading) && styles.printButtonDisabled]}
          onPress={handlePrint}
          disabled={!selectedFile || isUploading}
        >
          <Text style={styles.printButtonText}>
            {isUploading ? 'جاري الإرسال...' : 'طباعة الآن'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  fileCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  uploadButton: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  counterButton: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginHorizontal: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#dc2626',
  },
  toggleText: {
    fontSize: 12,
    color: '#6b7280',
  },
  toggleTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  costCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  costValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  bottomActions: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  printButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  printButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});