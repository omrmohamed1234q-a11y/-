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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="A4">A4</TabsTrigger>
          <TabsTrigger value="A3">A3</TabsTrigger>
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
                title="ورق لامع/مطفي"
                icon={Palette}
                tiers={pricingTiers.A4.glossy_matte}
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
                title="ورق لامع/مطفي"
                icon={Palette}
                tiers={pricingTiers.A3.glossy_matte}
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
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">ملاحظات مهمة:</h3>
        <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-sm">
          <li>• الأسعار شاملة ضريبة القيمة المضافة</li>
          <li>• خصم تلقائي 10% على الطباعة بالأبيض والأسود</li>
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