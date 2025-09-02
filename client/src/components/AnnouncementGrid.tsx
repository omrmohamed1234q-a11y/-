import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Sparkles, Calendar, Clock, ChevronRight } from "lucide-react";
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
  // Show static announcements without API calls to avoid errors
  const announcements = [
    {
      id: '1',
      title: 'خدمة الطباعة السريعة',
      description: 'اطبع مستنداتك بجودة عالية وسرعة فائقة',
      buttonText: 'اطلب الآن',
      imageUrl: '',
      position: 1,
      isActive: true,
      category: 'service',
      backgroundColor: 'from-blue-500 to-purple-600'
    },
    {
      id: '2',
      title: 'عروض خاصة',
      description: 'اشترك في باقاتنا الشهرية واحصل على خصومات رائعة',
      buttonText: 'اشترك الآن',
      imageUrl: '',
      position: 2,
      isActive: true,
      category: 'offer',
      backgroundColor: 'from-green-500 to-teal-600'
    },
    {
      id: '3',
      title: 'خدمة 24/7',
      description: 'نعمل على مدار الساعة لخدمتك في أي وقت',
      buttonText: 'تواصل معنا',
      imageUrl: '',
      position: 3,
      isActive: true,
      category: 'service',
      backgroundColor: 'from-orange-500 to-red-600'
    },
    {
      id: '4',
      title: 'تطبيق الجوال',
      description: 'حمّل تطبيقنا واحصل على تجربة أفضل',
      buttonText: 'قريباً',
      imageUrl: '',
      position: 4,
      isActive: true,
      category: 'app',
      backgroundColor: 'from-purple-500 to-pink-600'
    }
  ];

  // Static announcements display - no loading or error states needed

  const handleAnnouncementClick = (announcement: Announcement) => {
    // Check if it's an article
    if (announcement.category === 'article') {
      window.location.href = `/article/${announcement.id}`;
      return;
    }

    // Handle other button actions
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
      {/* Enhanced Creative Header */}
      <motion.div 
        className="flex items-center justify-between mb-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
              خدماتنا المميزة
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              اكتشف أحدث العروض والخدمات المتميزة
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2 text-lg">
          {announcements.length} خدمة
        </Badge>
      </motion.div>
      
      {/* Enhanced Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl overflow-hidden border border-gray-200/50 bg-white/90 backdrop-blur-sm hover:scale-[1.02]"
              data-testid={`announcement-card-${announcement.id}`}
            >
              <CardContent className="p-0 h-72 relative">
                {/* Background Image with enhanced overlay */}
                {announcement.imageUrl && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${announcement.imageUrl})`,
                    }}
                  />
                )}
                
                {/* Gradient overlay for better text readability */}
                <div 
                  className="absolute inset-0 transition-all duration-300"
                  style={{
                    background: announcement.imageUrl 
                      ? `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4), transparent 60%)`
                      : `linear-gradient(135deg, ${announcement.backgroundColor || '#2563eb'}, ${announcement.backgroundColor || '#2563eb'}dd)`
                  }}
                />
                
                {/* Enhanced Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                  {/* Top Section - Category Badge */}
                  <div className="flex justify-between items-start">
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm text-xs px-2 py-1"
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
                  
                  {/* Middle Section - Compact Title and Description */}
                  <div className="flex-1 flex flex-col justify-center space-y-2">
                    <h3 
                      className="text-lg md:text-xl font-bold leading-tight drop-shadow-lg line-clamp-2"
                      style={{ color: announcement.textColor || '#ffffff' }}
                      data-testid={`announcement-title-${announcement.id}`}
                    >
                      {announcement.title}
                    </h3>
                    {announcement.description && (
                      <p 
                        className="text-sm opacity-90 line-clamp-3 drop-shadow-md mt-2"
                        style={{ color: announcement.textColor || '#ffffff' }}
                        data-testid={`announcement-description-${announcement.id}`}
                      >
                        {announcement.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Bottom Section - Compact Action Button */}
                  <div className="mt-auto">
                    {announcement.buttonText && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnnouncementClick(announcement)}
                        className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm group-hover:bg-white/40 group-hover:border-white/50"
                        data-testid={`announcement-button-${announcement.id}`}
                      >
                        <span className="flex items-center justify-center gap-1">
                          {announcement.buttonText}
                          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </motion.button>
                    )}
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
      

    </div>
  );
}