import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPricingTiers } from '@/lib/pricing';
import { FileText, Palette, Star, Sticker, Info } from 'lucide-react';

interface PriceCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tiers: { range: string; price: string }[];
  description?: string;
}

function PriceCard({ title, icon: Icon, tiers, description }: PriceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
      )}
      
      <div className="space-y-1">
        {tiers && tiers.map((tier, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{tier.range}</span>
            <Badge variant="secondary" className="text-xs font-medium">
              {tier.price}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PriceGuideProps {
  compact?: boolean;
}

export function PriceGuide({ compact = false }: PriceGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pricingTiers = getPricingTiers();

  const content = (
    <div className="space-y-6">
      <Tabs defaultValue="A4" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="A4">A4</TabsTrigger>
          <TabsTrigger value="A3">A3</TabsTrigger>
          <TabsTrigger value="A0">A0</TabsTrigger>
          <TabsTrigger value="A1">A1</TabsTrigger>
          <TabsTrigger value="A2">A2</TabsTrigger>
        </TabsList>

        <TabsContent value="A4" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* A4 Plain */}
            <div className="space-y-4">
              <PriceCard
                title="ورق عادي - وجه واحد"
                icon={FileText}
                tiers={pricingTiers.A4.plain.face}
                description="الأكثر شيوعاً واقتصادية"
              />
              <PriceCard
                title="ورق عادي - وجهين"
                icon={FileText}
                tiers={pricingTiers.A4.plain.face_back}
                description="توفير في استهلاك الورق"
              />
            </div>
            
            <div className="space-y-4">
              <PriceCard
                title="ورق كوشيه"
                icon={Palette}
                tiers={pricingTiers.A4.coated}
                description="جودة عالية للصور والعروض"
              />
              <PriceCard
                title="ورق جلوسي"
                icon={Star}
                tiers={pricingTiers.A4.glossy}
                description="ورق لامع عالي اللمعة للصور عالية الجودة"
              />
              <PriceCard
                title="ورق استيكر"
                icon={Sticker}
                tiers={pricingTiers.A4.sticker}
                description="مثالي للملصقات واللافتات"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="A3" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* A3 Plain */}
            <div className="space-y-4">
              <PriceCard
                title="ورق عادي - وجه واحد"
                icon={FileText}
                tiers={pricingTiers.A3.plain.face}
                description="مناسب للمخططات والملصقات الكبيرة"
              />
              <PriceCard
                title="ورق عادي - وجهين"
                icon={FileText}
                tiers={pricingTiers.A3.plain.face_back}
                description="توفير في التكلفة للكميات الكبيرة"
              />
            </div>
            
            <div className="space-y-4">
              <PriceCard
                title="ورق كوشيه"
                icon={Palette}
                tiers={pricingTiers.A3.coated}
                description="جودة احترافية للعروض الكبيرة"
              />
              <PriceCard
                title="ورق جلوسي"
                icon={Star}
                tiers={pricingTiers.A3.glossy}
                description="ورق لامع عالي اللمعة للصور عالية الجودة"
              />
              <PriceCard
                title="ورق استيكر"
                icon={Sticker}
                tiers={pricingTiers.A3.sticker}
                description="ملصقات كبيرة الحجم عالية الجودة"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="A0" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <PriceCard
              title="A0 - أبيض وأسود فقط"
              icon={FileText}
              tiers={pricingTiers.A0.plain_bw}
              description="الحجم الأكبر، مناسب للملصقات واللوحات الكبيرة"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="A1" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <PriceCard
              title="A1 - أبيض وأسود فقط"
              icon={FileText}
              tiers={pricingTiers.A1.plain_bw}
              description="حجم كبير مناسب للعروض والمخططات"
            />
          </div>
        </TabsContent>

        <TabsContent value="A2" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <PriceCard
              title="A2 - أبيض وأسود فقط"
              icon={FileText}
              tiers={pricingTiers.A2.plain_bw}
              description="حجم متوسط مناسب للعروض والرسوم البيانية"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Paper Types Visual Guide */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          دليل أنواع الورق المرئي
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 space-x-reverse p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded"></div>
            <div>
              <div className="font-medium text-sm">ورق عادي</div>
              <div className="text-xs text-gray-600">للمستندات والنصوص العادية</div>
              <div className="text-xs text-green-600 font-medium">الأرخص والأكثر شيوعاً</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="w-6 h-6 bg-gradient-to-r from-white to-gray-200 border border-gray-400 rounded shadow-sm"></div>
            <div>
              <div className="font-medium text-sm">ورق كوشيه</div>
              <div className="text-xs text-gray-600">ورق عالي الجودة</div>
              <div className="text-xs text-blue-600 font-medium">للصور والتصاميم الملونة</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-400 rounded shadow-lg"></div>
            <div>
              <div className="font-medium text-sm">ورق جلوسي</div>
              <div className="text-xs text-gray-600">ورق لامع عالي اللمعة</div>
              <div className="text-xs text-purple-600 font-medium">للصور عالية الجودة</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
            <div>
              <div className="font-medium text-sm">ورق لاصق (استيكر)</div>
              <div className="text-xs text-gray-600">ورق بطبقة لاصقة خلفية</div>
              <div className="text-xs text-orange-600 font-medium">للملصقات والتسميات</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">ملاحظات مهمة:</h3>
        <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-sm">
          <li>• الأسعار شاملة ضريبة القيمة المضافة</li>
          <li>• خصم تلقائي 10% على الطباعة بالأبيض والأسود</li>
          <li>• <strong>A0 و A1: 30 جنيه، A2: 25 جنيه (أبيض وأسود فقط)</strong></li>
          <li>• خصومات إضافية للكميات الكبيرة (أكثر من 1000 صفحة لـ A4)</li>
          <li>• جودة طباعة عالية بدقة 300 DPI</li>
          <li>• إمكانية التسليم السريع والاستلام من الفرع</li>
        </ul>
      </div>
    </div>
  );

  if (compact) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Info className="h-4 w-4 ml-2" />
            دليل الأسعار والأوراق
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-accent">دليل الأسعار الشامل</h2>
              <p className="text-muted-foreground">أسعار شفافة لجميع أنواع وأحجام الورق</p>
            </div>
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-accent">دليل الأسعار الشامل</h1>
        <p className="text-muted-foreground mt-2">أسعار شفافة لجميع أنواع وأحجام الورق</p>
      </div>
      {content}
    </div>
  );
}