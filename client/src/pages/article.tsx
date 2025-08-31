import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, User, Tag } from 'lucide-react';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';

interface Article {
  id: string;
  title: string;
  description?: string;
  articleContent?: string;
  articleAuthor?: string;
  articleReadTime?: number;
  articleTags?: string[];
  imageUrl: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function ArticlePage() {
  const [location] = useLocation();
  const articleId = location.split('/')[2]; // Extract ID from /article/:id

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [`/api/announcements/${articleId}`],
    enabled: !!articleId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex flex-col items-center justify-center h-96 text-center px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            المقال غير موجود
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            لم نتمكن من العثور على المقال المطلوب
          </p>
          <Button onClick={() => window.history.back()}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header />
      
      <main className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4">
          {/* Article Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            {/* Hero Image */}
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-6">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <Badge className="mb-3 bg-blue-600 text-white">
                  📖 {article.category === 'article' ? 'مقال' : article.category}
                </Badge>
                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                  {article.title}
                </h1>
              </div>
            </div>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-6">
              {article.articleAuthor && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{article.articleAuthor}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.createdAt)}</span>
              </div>
              
              {article.articleReadTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{article.articleReadTime} دقيقة قراءة</span>
                </div>
              )}
            </div>

            {/* Article Description */}
            {article.description && (
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {article.description}
              </p>
            )}
          </motion.div>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="mb-8">
              <CardContent className="p-8">
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400"
                  dangerouslySetInnerHTML={{ 
                    __html: article.articleContent || 'محتوى المقال غير متاح حالياً' 
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Article Tags */}
          {article.articleTags && article.articleTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      الكلمات المفتاحية
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.articleTags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              size="lg"
              className="px-8"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              العودة للخلف
            </Button>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}