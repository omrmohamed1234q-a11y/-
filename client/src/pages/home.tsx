import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    window.location.href = '/api/logout';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="text-center">
          <div className="text-xl mb-2">مرحباً بك في</div>
          <div className="text-3xl font-bold mb-3">اطبعلي</div>
          <div className="text-lg">أهلاً {user?.fullName || 'عزيزي المستخدم'}!</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">الخدمات السريعة</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/print">
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">🖨️</div>
                  <div className="text-lg font-semibold">طباعة مستند</div>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-gradient-to-r from-pink-500 to-red-500 text-white cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">📱</div>
                <div className="text-lg font-semibold">مسح ضوئي</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">📄</div>
                <div className="text-lg font-semibold">معالجة PDF</div>
              </CardContent>
            </Card>

            <Link href="/store">
              <Card className="bg-gradient-to-r from-green-400 to-teal-500 text-white cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">🛒</div>
                  <div className="text-lg font-semibold">المتجر</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* User Stats */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">إحصائياتك</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-white shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500 mb-2">0</div>
                <div className="text-sm text-gray-600">طلبات الطباعة</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500 mb-2">0</div>
                <div className="text-sm text-gray-600">النقاط المكتسبة</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500 mb-2">0</div>
                <div className="text-sm text-gray-600">المشتريات</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-3">
          <Link href="/print">
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg">
              خدمات الطباعة 🖨️
            </Button>
          </Link>

          <Link href="/store">
            <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg">
              المتجر الإلكتروني 🛒
            </Button>
          </Link>

          <Link href="/rewards">
            <Button className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-lg">
              نظام المكافآت 🎁
            </Button>
          </Link>

          <Link href="/profile">
            <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-lg">
              الملف الشخصي 👤
            </Button>
          </Link>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-lg"
        >
          تسجيل الخروج 🚪
        </Button>
      </div>
    </div>
  );
}
