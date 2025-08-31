import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Sparkles, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

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
  articleContent?: string;
  articleAuthor?: string;
  articleReadTime?: number;
  articleTags?: string[];
  showOnHomepage?: boolean;
  homepagePriority?: number;
}

export function AnnouncementGrid() {
  console.log('🎯 AnnouncementGrid component mounted');
  
  const { data: announcements = [], isLoading, error } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements/homepage'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug logging
  console.log('📊 AnnouncementGrid State:', {
    isLoading,
    error: error ? error.toString() : null,
    announcements: announcements,
    announcementsLength: announcements?.length,
    queryKey: ['/api/announcements/homepage']
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-48 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-72 animate-pulse overflow-hidden">
              <CardContent className="p-0 h-full">
                <div className="bg-gray-200 dark:bg-gray-700 h-full rounded-xl"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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
      <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-semibold">
          لا توجد إعلانات حالياً (تم تحميل {announcements?.length || 0} إعلانات)
        </p>
        <p className="text-red-500 text-sm mt-2">
          Debug: isLoading={isLoading.toString()}, error={error ? 'yes' : 'no'}
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
    <div className="w-full" dir="rtl">
      {/* Header Section with beautiful styling */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            خدماتنا المميزة
          </h2>
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          اكتشف أحدث الخدمات والعروض الحصرية المصممة خصيصاً لك
        </p>
      </motion.div>
      
      {/* Announcements Grid - 4 columns for homepage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {announcements.slice(0, 4).map((announcement: Announcement, index: number) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              scale: 1.05, 
              y: -5,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Card 
              className="group cursor-pointer transition-all duration-300 hover:shadow-2xl overflow-hidden border-0 bg-white/80 backdrop-blur-sm"
              data-testid={`announcement-card-${announcement.id}`}
            >
              <CardContent className="p-0 h-72 relative">
                {/* Background Image with enhanced overlay */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${announcement.imageUrl})`,
                  }}
                />
                
                {/* Gradient overlay for better text readability */}
                <div 
                  className="absolute inset-0 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${announcement.backgroundColor || '#2563eb'}dd, ${announcement.backgroundColor || '#2563eb'}aa, transparent 70%)`
                  }}
                />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                  {/* Top Section - Category Badge */}
                  <div className="flex justify-between items-start">
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
                      data-testid={`announcement-category-${announcement.id}`}
                    >
                      {announcement.category === 'service' ? '🔧 خدمة' : 
                       announcement.category === 'promotion' ? '🎁 عرض' : 
                       announcement.category === 'announcement' ? '📢 إعلان' : 
                       announcement.category === 'article' ? '📖 مقال' : announcement.category}
                    </Badge>
                    
                    {announcement.category === 'article' && announcement.articleReadTime && (
                      <Badge 
                        variant="outline" 
                        className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                        data-testid={`announcement-read-time-${announcement.id}`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {announcement.articleReadTime} د
                      </Badge>
                    )}
                  </div>
                  
                  {/* Middle Section - Title and Description */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 
                      className="text-xl font-bold mb-3 leading-tight drop-shadow-lg"
                      data-testid={`announcement-title-${announcement.id}`}
                    >
                      {announcement.title}
                    </h3>
                    {announcement.description && (
                      <p 
                        className="text-sm opacity-95 line-clamp-2 drop-shadow-md"
                        data-testid={`announcement-description-${announcement.id}`}
                      >
                        {announcement.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Bottom Section - Action Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleAnnouncementClick(announcement)}
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 hover:bg-white text-gray-900 border-0 hover:shadow-lg transition-all duration-300 font-semibold px-6 py-2"
                      data-testid={`announcement-button-${announcement.id}`}
                    >
                      {announcement.buttonText}
                      {announcement.buttonAction === 'link' && (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-2 right-2 w-20 h-20 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute bottom-2 left-2 w-16 h-16 rounded-full bg-white/5 blur-xl"></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Bottom section with encouraging message */}
      <motion.div 
        className="text-center mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="text-gray-700 text-lg font-medium">
          🎉 المزيد من الخدمات والعروض في انتظارك!
        </p>
        <p className="text-gray-600 mt-2">
          تصفح قائمة الخدمات الكاملة واستمتع بتجربة فريدة
        </p>
      </motion.div>
    </div>
  );
}