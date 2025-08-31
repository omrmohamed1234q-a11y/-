import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  MapPin, Phone, Clock, Star, Shield, 
  Truck, CreditCard, ChevronRight, Building2
} from 'lucide-react';
import type { Partner } from '@shared/schema';

export function PartnersSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: partners, isLoading } = useQuery({
    queryKey: ['/api/partners/featured'],
    retry: false,
  });

  const categories = [
    { id: 'all', name: 'جميع الشركاء', icon: Building2 },
    { id: 'print_shop', name: 'مطابع', icon: Building2 },
    { id: 'bookstore', name: 'مكتبات', icon: Building2 },
    { id: 'library', name: 'مكتبات عامة', icon: Building2 },
    { id: 'stationery', name: 'أدوات مكتبية', icon: Building2 },
  ];

  const filteredPartners = (partners as Partner[] || []).filter((partner: Partner) => 
    selectedCategory === 'all' || partner.businessType === selectedCategory
  );

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            شركاؤنا المعتمدون
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            اكتشف شبكتنا من المطابع والمكتبات المعتمدة في جميع أنحاء مصر
          </motion.p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-sm hover:shadow-md'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <IconComponent className="w-4 h-4" />
                {category.name}
              </motion.button>
            );
          })}
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPartners.map((partner: Partner, index: number) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="group h-full bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2">
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  {partner.coverImageUrl ? (
                    <img 
                      src={partner.coverImageUrl} 
                      alt={partner.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-white/70" />
                    </div>
                  )}
                  
                  {/* Business Type Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/90 text-blue-700 backdrop-blur-sm">
                      {partner.businessType === 'print_shop' && 'مطبعة'}
                      {partner.businessType === 'bookstore' && 'مكتبة'}
                      {partner.businessType === 'library' && 'مكتبة عامة'}
                      {partner.businessType === 'stationery' && 'أدوات مكتبية'}
                    </Badge>
                  </div>

                  {/* Verified Badge */}
                  {partner.isVerified && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-green-500 text-white">
                        <Shield className="w-3 h-3 mr-1" />
                        معتمد
                      </Badge>
                    </div>
                  )}

                  {/* Logo Overlay */}
                  {partner.logoUrl && (
                    <div className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded-full shadow-lg p-2">
                      <img 
                        src={partner.logoUrl} 
                        alt={`${partner.name} Logo`}
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {partner.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {partner.shortDescription || partner.description}
                    </p>
                  </div>

                  {/* Rating & Reviews */}
                  {partner.rating && Number(partner.rating) > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">
                          {Number(partner.rating).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        ({partner.reviewCount} تقييم)
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-2 mb-3 text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      {partner.city}, {partner.governorate}
                    </span>
                  </div>

                  {/* Phone */}
                  {partner.phone && (
                    <div className="flex items-center gap-2 mb-4 text-gray-600">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="text-sm" dir="ltr">{partner.phone}</span>
                    </div>
                  )}

                  {/* Services */}
                  {partner.services && partner.services.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {partner.services.slice(0, 3).map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service === 'printing' && 'طباعة'}
                            {service === 'binding' && 'تجليد'}
                            {service === 'scanning' && 'مسح ضوئي'}
                            {service === 'design' && 'تصميم'}
                            {service === 'books' && 'كتب'}
                            {service === 'stationery' && 'أدوات مكتبية'}
                          </Badge>
                        ))}
                        {partner.services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{partner.services.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {partner.hasDelivery && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Truck className="w-4 h-4" />
                          <span className="text-xs">توصيل</span>
                        </div>
                      )}
                      {partner.acceptsOnlinePayment && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-xs">دفع إلكتروني</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white group"
                    data-testid={`button-view-partner-${partner.id}`}
                  >
                    <span>عرض التفاصيل</span>
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPartners.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              لا يوجد شركاء في هذه الفئة
            </h3>
            <p className="text-gray-500">
              جاري العمل على إضافة المزيد من الشركاء قريباً
            </p>
          </div>
        )}

        {/* View All Button */}
        {filteredPartners.length > 0 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
              data-testid="button-view-all-partners"
            >
              عرض جميع الشركاء
              <ChevronRight className="w-5 h-5 mr-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}