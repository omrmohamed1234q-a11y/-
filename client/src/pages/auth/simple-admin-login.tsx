export default function SimpleAdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl border-2 border-red-200">
          <div className="text-center p-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold">
              دخول المدير الآمن
            </h1>
            <p className="text-red-100 text-sm mt-2">
              وصول محدود للإداريين المصرح لهم فقط
            </p>
          </div>

          <div className="p-8">
            <form className="space-y-6">
              <div>
                <label className="block text-right text-sm font-medium text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                  placeholder="أدخل اسم المستخدم"
                />
              </div>

              <div>
                <label className="block text-right text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>

              <div>
                <label className="block text-right text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                  placeholder="أدخل كلمة المرور"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-semibold rounded-md"
              >
                دخول آمن
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-2">
              <p className="text-sm text-gray-600">
                🔒 جلسة آمنة مع تشفير متقدم
              </p>
              <p className="text-xs text-gray-500">
                جميع الأنشطة مسجلة ومراقبة للأمان
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            في حالة واجهت مشاكل في الدخول، تواصل مع الإدارة التقنية
          </p>
        </div>
      </div>
    </div>
  );
}