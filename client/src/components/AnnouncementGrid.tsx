import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  description?: string;
  buttonText: string;
  buttonAction?: string;
  buttonUrl?: string;
  imageUrl: string;
  position: number;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  category: string;
}

export function AnnouncementGrid() {
  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['/api/announcements'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-48 animate-pulse">
            <CardContent className="p-0 h-full">
              <div className="bg-gray-200 dark:bg-gray-700 h-full rounded-lg"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Error loading announcements:', error);
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          تعذر تحميل الإعلانات
        </p>
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          لا توجد إعلانات حالياً
        </p>
      </div>
    );
  }

  const handleAnnouncementClick = (announcement: Announcement) => {
    if (announcement.buttonAction === 'link' && announcement.buttonUrl) {
      if (announcement.buttonUrl.startsWith('http')) {
        // External link
        window.open(announcement.buttonUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Internal link
        window.location.href = announcement.buttonUrl;
      }
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          خدماتنا وإعلاناتنا
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          اكتشف جميع الخدمات والعروض المتاحة
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {announcements.map((announcement: Announcement) => (
          <Card 
            key={announcement.id} 
            className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden"
            data-testid={`announcement-card-${announcement.id}`}
          >
            <CardContent className="p-0 h-48 relative">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${announcement.imageUrl})`,
                }}
              />
              
              {/* Content Overlay */}
              <div 
                className="absolute inset-0 p-4 flex flex-col justify-between text-white"
                style={{ 
                  backgroundColor: announcement.backgroundColor ? `${announcement.backgroundColor}95` : '#ff6b3595',
                  color: announcement.textColor || '#ffffff'
                }}
              >
                <div className="flex-1">
                  <h3 
                    className="text-lg font-bold mb-2 leading-tight"
                    data-testid={`announcement-title-${announcement.id}`}
                  >
                    {announcement.title}
                  </h3>
                  {announcement.description && (
                    <p 
                      className="text-sm opacity-90 line-clamp-3"
                      data-testid={`announcement-description-${announcement.id}`}
                    >
                      {announcement.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Button
                    onClick={() => handleAnnouncementClick(announcement)}
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
                    data-testid={`announcement-button-${announcement.id}`}
                  >
                    {announcement.buttonText}
                    {announcement.buttonAction === 'link' && (
                      <ExternalLink className="mr-1 h-3 w-3" />
                    )}
                  </Button>
                  
                  {announcement.category && (
                    <span 
                      className="text-xs bg-white/20 px-2 py-1 rounded-full"
                      data-testid={`announcement-category-${announcement.id}`}
                    >
                      {announcement.category === 'service' ? 'خدمة' : 
                       announcement.category === 'promotion' ? 'عرض' : 
                       announcement.category === 'announcement' ? 'إعلان' : announcement.category}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}