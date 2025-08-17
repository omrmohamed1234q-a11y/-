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

interface PaymentScreenProps {
  navigation: any;
  route: {
    params: {
      printJob: any;
    };
  };
}

export default function PaymentScreen({ navigation, route }: PaymentScreenProps) {
  const { printJob } = route.params;
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [vodafoneNumber, setVodafoneNumber] = useState('');

  const paymentMethods = [
    {
      id: 'google_pay',
      title: 'Google Pay',
      subtitle: 'الدفع باستخدام Google Pay',
      icon: 'card',
      color: '#4285f4',
    },
    {
      id: 'vodafone_cash',
      title: 'فودافون كاش',
      subtitle: 'الدفع عبر خدمة فودافون كاش',
      icon: 'phone-portrait',
      color: '#e60012',
    },
    {
      id: 'cash',
      title: 'الدفع عند الاستلام',
      subtitle: 'ادفع عند استلام المطبوعات',
      icon: 'cash',
      color: '#059669',
    },
  ];

  const orderTotal = 15.50; // Mock total
  const vatAmount = orderTotal * 0.14; // 14% VAT
  const finalTotal = orderTotal + vatAmount;

  const handlePayment = async () => {
    if (!selectedPayment) {
      Alert.alert('تنبيه', 'يرجى اختيار طريقة الدفع');
      return;
    }

    if (selectedPayment === 'vodafone_cash' && !vodafoneNumber) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم فودافون كاش');
      return;
    }

    try {
      // Process payment based on selected method
      let paymentResult;
      
      switch (selectedPayment) {
        case 'google_pay':
          paymentResult = await processGooglePay();
          break;
        case 'vodafone_cash':
          paymentResult = await processVodafoneCash();
          break;
        case 'cash':
          paymentResult = { success: true, message: 'سيتم الدفع عند الاستلام' };
          break;
      }

      if (paymentResult.success) {
        Alert.alert(
          'تم الدفع بنجاح',
          'تم قبول طلب الطباعة وسيتم تجهيزه قريباً',
          [
            {
              text: 'حسناً',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('خطأ', 'فشل في إتمام الدفع. حاول مرة أخرى');
    }
  };

  const processGooglePay = async () => {
    // Mock Google Pay integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, transactionId: 'GP_' + Date.now() });
      }, 2000);
    });
  };

  const processVodafoneCash = async () => {
    // Mock Vodafone Cash integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, transactionId: 'VC_' + Date.now() });
      }, 2000);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الدفع</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخص الطلب</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>اسم الملف</Text>
              <Text style={styles.summaryValue}>{printJob?.fileName || 'document.pdf'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>عدد النسخ</Text>
              <Text style={styles.summaryValue}>{printJob?.settings?.copies || 1}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>نوع الطباعة</Text>
              <Text style={styles.summaryValue}>
                {printJob?.settings?.colorMode === 'color' ? 'ملون' : 'أبيض وأسود'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>حجم الورق</Text>
              <Text style={styles.summaryValue}>{printJob?.settings?.paperSize || 'A4'}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>طريقة الدفع</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPayment === method.id && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <View style={[styles.paymentIcon, { backgroundColor: method.color }]}>
                  <Ionicons name={method.icon as any} size={24} color="white" />
                </View>
                <View style={styles.paymentContent}>
                  <Text style={styles.paymentTitle}>{method.title}</Text>
                  <Text style={styles.paymentSubtitle}>{method.subtitle}</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPayment === method.id && styles.radioButtonSelected
                ]}>
                  {selectedPayment === method.id && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vodafone Cash Input */}
        {selectedPayment === 'vodafone_cash' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>رقم فودافون كاش</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="phone-portrait" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="01xxxxxxxxx"
                value={vodafoneNumber}
                onChangeText={setVodafoneNumber}
                keyboardType="phone-pad"
                maxLength={11}
                textAlign="right"
              />
            </View>
          </View>
        )}

        {/* Cost Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل التكلفة</Text>
          <View style={styles.costCard}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>إجمالي الطباعة</Text>
              <Text style={styles.costValue}>{orderTotal.toFixed(2)} ج.م</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>ضريبة القيمة المضافة (14%)</Text>
              <Text style={styles.costValue}>{vatAmount.toFixed(2)} ج.م</Text>
            </View>
            <View style={[styles.costRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>الإجمالي النهائي</Text>
              <Text style={styles.totalValue}>{finalTotal.toFixed(2)} ج.م</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.payButton, !selectedPayment && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={!selectedPayment}
        >
          <Text style={styles.payButtonText}>
            ادفع {finalTotal.toFixed(2)} ج.م
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
    backgroundColor: '#dc2626',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
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
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  costCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
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
  payButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});