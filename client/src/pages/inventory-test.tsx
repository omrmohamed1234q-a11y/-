export default function InventoryTest() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✅ صفحة المخزون تعمل!</h1>
        <p className="text-xl text-gray-700 mb-6">هذا اختبار بسيط للتأكد من أن الصفحة تُحمّل بشكل صحيح</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">معلومات الاختبار:</h2>
          <ul className="text-blue-700 space-y-1">
            <li>• الصفحة تُحمّل بنجاح</li>
            <li>• التوجيه يعمل بشكل صحيح</li>
            <li>• React يعمل بدون مشاكل</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-bold text-green-800">النظام يعمل</h3>
            <p className="text-green-600">كل شيء جاهز!</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="font-bold text-blue-800">التصميم يعمل</h3>
            <p className="text-blue-600">Tailwind CSS يعمل</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="font-bold text-purple-800">الخط العربي</h3>
            <p className="text-purple-600">يظهر بشكل صحيح</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">إذا كنت ترى هذه الرسالة، فإن المشكلة قد تم حلها!</p>
        </div>
      </div>
    </div>
  );
}