import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';

interface Announcement {
  id: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonAction?: string;
  buttonUrl?: string;
  imageUrl?: string;
  position: number;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  category: string;
  showOnHomepage?: boolean;
  homepagePriority?: number;
}

export default function TestAnnouncements() {
  const { data: announcements = [], isLoading, error } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements/homepage'],
    staleTime: 0, // Always fetch fresh data
  });

  console.log('TestAnnouncements Debug:', {
    isLoading,
    error: error ? error.toString() : null,
    announcements,
    announcementsLength: announcements?.length
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center" dir="rtl">اختبار الإعلانات</h1>
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل الإعلانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center" dir="rtl">اختبار الإعلانات</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">خطأ في تحميل الإعلانات</h2>
            <p className="text-red-600">{error.toString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">اختبار الإعلانات</h1>
        
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-blue-800 font-semibold mb-2">معلومات التصحيح</h2>
          <ul className="text-blue-700 space-y-1">
            <li>حالة التحميل: {isLoading ? 'يحمل' : 'تم'}</li>
            <li>عدد الإعلانات: {announcements?.length || 0}</li>
            <li>يوجد خطأ: {error ? 'نعم' : 'لا'}</li>
          </ul>
        </div>

        {announcements.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-semibold">لا توجد إعلانات للعرض</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div 
                    className="p-6 text-white"
                    style={{ 
                      backgroundColor: announcement.backgroundColor || '#2563eb',
                      color: announcement.textColor || '#ffffff'
                    }}
                  >
                    <h3 className="text-xl font-bold mb-2">{announcement.title}</h3>
                    <p className="mb-4">{announcement.description}</p>
                    {announcement.buttonText && (
                      <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
                        {announcement.buttonText}
                      </button>
                    )}
                    <div className="mt-4 text-sm opacity-75">
                      <p>معرف: {announcement.id}</p>
                      <p>أولوية الصفحة الرئيسية: {announcement.homepagePriority}</p>
                      <p>يظهر في الصفحة الرئيسية: {announcement.showOnHomepage ? 'نعم' : 'لا'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}