import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, FileText, Palette, Star, Sticker } from 'lucide-react';
import { getPricingTiers } from '@/lib/pricing';

interface PriceGuideProps {
  compact?: boolean;
}

export function PriceGuide({ compact = false }: PriceGuideProps) {
  const pricingTiers = getPricingTiers();

  const PriceCard = ({ 
    title, 
    icon: Icon, 
    tiers, 
    color = "default",
    description 
  }: { 
    title: string; 
    icon: any; 
    tiers: Array<{ range: string; price: string }>; 
    color?: string;
    description?: string;
  }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {tiers.map((tier, index) => (
          <div key={index} className="flex justify-between items-center p-3 rounded-md bg-muted/50 min-h-[3rem]">
            <span className="text-sm font-medium flex-1 ml-3">{tier.range}</span>
            <Badge variant="secondary" className="price-text font-bold shrink-0">
              {tier.price}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const CompactView = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          دليل الأسعار
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            دليل أسعار الطباعة الشامل
          </DialogTitle>
        </DialogHeader>
        <FullView />
      </DialogContent>
    </Dialog>
  );

  const FullView = () => (
    <div className="space-y-6">
      {/* Discount Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-800 dark:text-green-200">خصم خاص على الطباعة بالأبيض والأسود</h3>
        </div>
        <p className="text-green-700 dark:text-green-300">
          احصل على <strong>خصم 10%</strong> عند اختيار الطباعة بالأبيض والأسود على جميع أنواع الورق
        </p>
      </div>

      <Tabs defaultValue="A4" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="A4">A4</TabsTrigger>
          <TabsTrigger value="A3">A3</TabsTrigger>
          <TabsTrigger value="A0">A0</TabsTrigger>
          <TabsTrigger value="A1">A1</TabsTrigger>
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
                title="ورق استيكر"
                icon={Sticker}
                tiers={pricingTiers.A4.sticker}
                description="مثالي للملصقات واللافتات"
              />
            </div>
          </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <PriceCard
              title="ورق جلوسي"
              icon={Star}
              tiers={pricingTiers.A4.glossy}
              description="ورق لامع عالي اللمعة للصور عالية الجودة"
            />
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
                title="ورق استيكر"
                icon={Sticker}
                tiers={pricingTiers.A3.sticker}
                description="ملصقات كبيرة الحجم عالية الجودة"
              />
            </div>
          </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <PriceCard
              title="ورق جلوسي"
              icon={Star}
              tiers={pricingTiers.A4.glossy}
              description="ورق لامع عالي اللمعة للصور عالية الجودة"
            />
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
          </div>
          <div className="grid grid-cols-1 gap-4">
            <PriceCard
              title="ورق جلوسي"
              icon={Star}
              tiers={pricingTiers.A4.glossy}
              description="ورق لامع عالي اللمعة للصور عالية الجودة"
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
          </div>
          <div className="grid grid-cols-1 gap-4">
            <PriceCard
              title="ورق جلوسي"
              icon={Star}
              tiers={pricingTiers.A4.glossy}
              description="ورق لامع عالي اللمعة للصور عالية الجودة"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="text-xs text-gray-600">ورق لامع عالي الجودة</div>
              <div className="text-xs text-blue-600 font-medium">للصور والتصاميم الملونة</div>
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
          <li>• <strong>A0 و A1: متوفر بالأبيض والأسود فقط بسعر 30 جنيه</strong></li>
          <li>• خصومات إضافية للكميات الكبيرة (أكثر من 1000 صفحة لـ A4)</li>
          <li>• جودة طباعة عالية بدقة 300 DPI</li>
          <li>• إمكانية التسليم السريع والاستلام من الفرع</li>
        </ul>
      </div>
    </div>
  );

  return compact ? <CompactView /> : <FullView />;
}

export default PriceGuide;