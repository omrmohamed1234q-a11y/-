import React from 'react';
import { Order } from '@shared/schema';
import { formatPrice } from '@/lib/utils';

interface InvoicePrintableProps {
  order: any; // Using any for now to include printFiles
}

export const InvoicePrintable: React.FC<InvoicePrintableProps> = ({ order }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-area');
    const originalContent = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const handleDownload = () => {
    const invoiceContent = document.getElementById('invoice-print-area');
    if (!invoiceContent) return;

    // Create a new window for the invoice
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>فاتورة - ${order.orderNumber}</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-blue-50 { background-color: #eff6ff; }
            .text-green-600 { color: #16a34a; }
            .text-blue-600 { color: #2563eb; }
            .text-gray-600 { color: #6b7280; }
            .text-xs { font-size: 0.75rem; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .pt-6 { padding-top: 1.5rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .grid-cols-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; }
            @media print {
              @page { margin: 1cm; }
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${invoiceContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const calculateSubtotal = () => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum: number, item: any) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
  };

  const tax = calculateSubtotal() * 0.14; // 14% VAT
  const total = calculateSubtotal() + tax - (order.pointsUsed || 0);

  return (
    <div className="w-full">
      {/* Print Actions */}
      <div className="p-4 border-b flex justify-between items-center no-print mb-4">
        <h2 className="text-xl font-bold">فاتورة الطلب #{order.orderNumber}</h2>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>طباعة</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>تحميل PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div id="invoice-print-area" className="p-8" dir="rtl">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #invoice-print-area * { visibility: visible; }
              #invoice-print-area { 
                position: absolute; 
                right: 0; 
                top: 0; 
                width: 100%; 
                padding: 20px;
                font-family: 'IBM Plex Sans Arabic', sans-serif;
              }
              .no-print { display: none !important; }
            }
          `}</style>

          {/* Header with Logo */}
          <div className="border-b-2 border-blue-600 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-blue-600 mb-2">اطبعلي</h1>
                <p className="text-gray-600">خدمات الطباعة والتصوير المتكاملة</p>
                <div className="mt-3 text-sm text-gray-500">
                  <p>📞 01234567890 | 📧 info@atbaali.com</p>
                  <p>📍 شارع التحرير، وسط البلد، القاهرة</p>
                </div>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">فاتورة</h2>
                <div className="text-sm text-gray-600">
                  <p><strong>رقم الفاتورة:</strong> #{order.id.slice(-8)}</p>
                  <p><strong>التاريخ:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
                  <p><strong>الوقت:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('ar-EG') : 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1">بيانات العميل</h3>
              <div className="space-y-2 text-sm">
                <p><strong>كود العميل:</strong> #{order.userId.slice(-6)}</p>
                <p><strong>الاسم:</strong> {(order.shippingAddress as any)?.name || 'غير محدد'}</p>
                <p><strong>الهاتف:</strong> {(order.shippingAddress as any)?.phone || 'غير محدد'}</p>
                <p><strong>العنوان:</strong> {(order.shippingAddress as any)?.address || 'غير محدد'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1">معلومات الطلب</h3>
              <div className="space-y-2 text-sm">
                <p><strong>نوع الطلب:</strong> {order.deliveryMethod === 'pickup' ? 'استلام من المحل' : 'توصيل منزلي'}</p>
                <p><strong>طريقة الدفع:</strong> {order.paymentMethod === 'cash' ? 'كاش' : order.paymentMethod === 'card' ? 'بطاقة' : 'غير محدد'}</p>
                <p><strong>حالة الطلب:</strong> {
                  order.status === 'pending' ? 'في الانتظار' :
                  order.status === 'processing' ? 'قيد المعالجة' :
                  order.status === 'printing' ? 'قيد الطباعة' :
                  order.status === 'delivered' ? 'تم التسليم' : 'غير محدد'
                }</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">تفاصيل المنتجات والخدمات</h3>
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 p-3 text-right">#</th>
                  <th className="border border-gray-300 p-3 text-right">المنتج / الخدمة</th>
                  <th className="border border-gray-300 p-3 text-center">الكمية</th>
                  <th className="border border-gray-300 p-3 text-center">السعر</th>
                  <th className="border border-gray-300 p-3 text-center">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {order.items && Array.isArray(order.items) ? order.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-3 text-center">{index + 1}</td>
                    <td className="border border-gray-300 p-3">
                      <div>
                        <strong>{item.name || `منتج ${index + 1}`}</strong>
                        {item.description && (
                          <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                        )}
                        {item.printJobData && (
                          <div className="text-xs text-blue-600 mt-1">
                            📄 {item.printJobData.filename}
                            {item.printJobData.fileUrl && (
                              <div className="mt-1">
                                <a 
                                  href={item.printJobData.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  🔗 فتح في Google Drive
                                </a>
                              </div>
                            )}
                            <div className="text-gray-500 mt-1">
                              {item.printJobData.copies} نسخة • {item.printJobData.paperSize} • {item.printJobData.colorMode}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 text-center">{item.quantity || 1}</td>
                    <td className="border border-gray-300 p-3 text-center">{item.price || 0} جنيه</td>
                    <td className="border border-gray-300 p-3 text-center font-bold">
                      {((item.price || 0) * (item.quantity || 1))} جنيه
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 p-6 text-center text-gray-500">
                      لا توجد منتجات في هذا الطلب
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <table className="w-full border border-gray-300">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3 text-right font-medium">المجموع الفرعي:</td>
                    <td className="border border-gray-300 p-3 text-center">{calculateSubtotal()} جنيه</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 text-right font-medium">ضريبة القيمة المضافة (14%):</td>
                    <td className="border border-gray-300 p-3 text-center">{formatPrice(tax)} جنيه</td>
                  </tr>
                  {order.pointsUsed && order.pointsUsed > 0 && (
                    <tr>
                      <td className="border border-gray-300 p-3 text-right font-medium text-green-600">خصم النقاط:</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">-{order.pointsUsed} جنيه</td>
                    </tr>
                  )}
                  <tr className="bg-blue-50">
                    <td className="border border-gray-300 p-3 text-right font-bold text-lg">المبلغ الإجمالي:</td>
                    <td className="border border-gray-300 p-3 text-center font-bold text-lg">{formatPrice(total)} جنيه</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms and Footer */}
          <div className="border-t pt-6 mt-6">
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">شروط وأحكام:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• يحق للعميل إرجاع المنتجات خلال 7 أيام من تاريخ الاستلام</li>
                  <li>• لا يمكن إرجاع المنتجات المطبوعة حسب الطلب إلا في حالة العيوب</li>
                  <li>• يتم احتساب رسوم الشحن حسب المنطقة الجغرافية</li>
                  <li>• جميع الأسعار شاملة ضريبة القيمة المضافة</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2">معلومات الإرجاع:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>لطلبات الإرجاع أو الاستفسارات:</p>
                  <p>📞 اتصل بنا: 01234567890</p>
                  <p>📧 البريد الإلكتروني: support@atbaali.com</p>
                  <p>🕒 ساعات العمل: 9 صباحاً - 9 مساءً</p>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 border-t pt-4">
              <p>شكراً لاختياركم اطبعلي - شريككم الموثوق في خدمات الطباعة</p>
              <p>تم إنشاء هذه الفاتورة إلكترونياً في {new Date().toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
      </div>
  );
};