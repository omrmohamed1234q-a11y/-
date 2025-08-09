import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function PrintScreen() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [copies, setCopies] = useState(1)
  const [color, setColor] = useState<'color' | 'bw'>('bw')
  const [sides, setSides] = useState<'single' | 'double'>('single')

  const handleFilePick = () => {
    Alert.alert('اختيار ملف', 'سيتم فتح منتقي الملفات', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'اختيار من الذاكرة', onPress: () => setSelectedFile('document.pdf') },
      { text: 'التقاط صورة', onPress: () => setSelectedFile('camera_scan.pdf') },
    ])
  }

  const handlePrint = () => {
    if (!selectedFile) {
      Alert.alert('خطأ', 'يرجى اختيار ملف للطباعة أولاً')
      return
    }

    Alert.alert(
      'تأكيد الطباعة',
      `هل تريد طباعة ${copies} نسخة من ${selectedFile}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'طباعة', onPress: () => Alert.alert('نجح', 'تم إرسال طلب الطباعة') },
      ]
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.header}>
        <Text style={styles.headerTitle}>خدمة الطباعة</Text>
        <Text style={styles.headerSubtitle}>اطبع مستنداتك بجودة عالية</Text>
      </LinearGradient>

      {/* File Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>اختيار الملف</Text>
        <TouchableOpacity style={styles.filePickerCard} onPress={handleFilePick}>
          {selectedFile ? (
            <View style={styles.selectedFile}>
              <Text style={styles.fileName}>{selectedFile}</Text>
              <Text style={styles.fileInfo}>PDF • 2.5 MB • 5 صفحات</Text>
            </View>
          ) : (
            <View style={styles.filePlaceholder}>
              <Text style={styles.uploadIcon}>📄</Text>
              <Text style={styles.uploadText}>اختر ملف للطباعة</Text>
              <Text style={styles.uploadSubtext}>PDF, DOC, DOCX, JPG, PNG</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Print Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إعدادات الطباعة</Text>
        
        {/* Copies */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>عدد النسخ</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setCopies(Math.max(1, copies - 1))}
            >
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{copies}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setCopies(copies + 1)}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>نوع الطباعة</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.option, color === 'bw' && styles.selectedOption]}
              onPress={() => setColor('bw')}
            >
              <Text style={[styles.optionText, color === 'bw' && styles.selectedOptionText]}>
                أبيض وأسود
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, color === 'color' && styles.selectedOption]}
              onPress={() => setColor('color')}
            >
              <Text style={[styles.optionText, color === 'color' && styles.selectedOptionText]}>
                ملون
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sides */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>الطباعة على الوجهين</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.option, sides === 'single' && styles.selectedOption]}
              onPress={() => setSides('single')}
            >
              <Text style={[styles.optionText, sides === 'single' && styles.selectedOptionText]}>
                وجه واحد
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, sides === 'double' && styles.selectedOption]}
              onPress={() => setSides('double')}
            >
              <Text style={[styles.optionText, sides === 'double' && styles.selectedOptionText]}>
                وجهين
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Price Summary */}
      <View style={styles.section}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ملخص التكلفة</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>عدد الصفحات:</Text>
            <Text style={styles.summaryValue}>5 صفحات</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>عدد النسخ:</Text>
            <Text style={styles.summaryValue}>{copies} نسخة</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>نوع الطباعة:</Text>
            <Text style={styles.summaryValue}>
              {color === 'color' ? 'ملون' : 'أبيض وأسود'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>الإجمالي:</Text>
            <Text style={styles.totalValue}>
              {color === 'color' ? copies * 5 * 0.5 : copies * 5 * 0.2} ريال
            </Text>
          </View>
        </View>
      </View>

      {/* Print Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.printButton, !selectedFile && styles.disabledButton]}
          onPress={handlePrint}
          disabled={!selectedFile}
        >
          <LinearGradient
            colors={selectedFile ? ['#EF2D50', '#DC2626'] : ['#9CA3AF', '#6B7280']}
            style={styles.printGradient}
          >
            <Text style={styles.printButtonText}>
              {selectedFile ? 'طباعة الآن' : 'اختر ملف أولاً'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  filePickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  selectedFile: {
    alignItems: 'center',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  fileInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  filePlaceholder: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    backgroundColor: '#EF2D50',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#EF2D50',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF2D50',
  },
  printButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  printGradient: {
    padding: 16,
    alignItems: 'center',
  },
  printButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bottomSpacer: {
    height: 20,
  },
})