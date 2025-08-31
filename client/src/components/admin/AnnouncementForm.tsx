import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, ExternalLink } from "lucide-react";

const announcementSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  buttonText: z.string().min(1, "نص الزر مطلوب"),
  buttonAction: z.enum(["link", "modal", "action"]).default("link"),
  buttonUrl: z.string().optional(),
  imageUrl: z.string().min(1, "رابط الصورة مطلوب"),
  position: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  backgroundColor: z.string().default("#ff6b35"),
  textColor: z.string().default("#ffffff"),
  category: z.enum(["service", "promotion", "announcement"]).default("service"),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface AnnouncementFormProps {
  announcement?: any;
  onSubmit: (data: AnnouncementFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AnnouncementForm({ 
  announcement, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: AnnouncementFormProps) {
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title || "",
      description: announcement?.description || "",
      buttonText: announcement?.buttonText || "تفاعل الآن",
      buttonAction: announcement?.buttonAction || "link",
      buttonUrl: announcement?.buttonUrl || "",
      imageUrl: announcement?.imageUrl || "",
      position: announcement?.position || 0,
      isActive: announcement?.isActive ?? true,
      backgroundColor: announcement?.backgroundColor || "#ff6b35",
      textColor: announcement?.textColor || "#ffffff",
      category: announcement?.category || "service",
    },
  });

  const { watch } = form;
  const watchedImageUrl = watch("imageUrl");
  const watchedTitle = watch("title");
  const watchedDescription = watch("description");
  const watchedButtonText = watch("buttonText");
  const watchedBackgroundColor = watch("backgroundColor");
  const watchedTextColor = watch("textColor");

  useEffect(() => {
    if (watchedImageUrl) {
      setImagePreview(watchedImageUrl);
    }
  }, [watchedImageUrl]);

  const handleImageUrlChange = (url: string) => {
    form.setValue("imageUrl", url);
    setImagePreview(url);
  };

  const categoryOptions = [
    { value: "service", label: "خدمة", color: "bg-blue-100 text-blue-800" },
    { value: "promotion", label: "عرض", color: "bg-green-100 text-green-800" },
    { value: "announcement", label: "إعلان", color: "bg-purple-100 text-purple-800" },
  ];

  const buttonActionOptions = [
    { value: "link", label: "رابط" },
    { value: "modal", label: "نافذة منبثقة" },
    { value: "action", label: "إجراء" },
  ];

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معاينة الإعلان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 rounded-lg overflow-hidden border">
            {imagePreview ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${imagePreview})`,
                  }}
                />
                <div 
                  className="absolute inset-0 p-4 flex flex-col justify-between text-white"
                  style={{ 
                    backgroundColor: `${watchedBackgroundColor}95`,
                    color: watchedTextColor
                  }}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2 leading-tight">
                      {watchedTitle || "عنوان الإعلان"}
                    </h3>
                    {watchedDescription && (
                      <p className="text-sm opacity-90 line-clamp-3">
                        {watchedDescription}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      type="button"
                    >
                      {watchedButtonText || "تفاعل الآن"}
                      <ExternalLink className="mr-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p>معاينة الصورة ستظهر هنا</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">العنوان *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="عنوان الإعلان"
                  data-testid="input-title"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="وصف مختصر للإعلان"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">فئة الإعلان</Label>
                <Select 
                  value={form.watch("category")} 
                  onValueChange={(value) => form.setValue("category", value as "service" | "promotion" | "announcement")}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={option.color}>{option.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">ترتيب العرض</Label>
                  <Input
                    id="position"
                    type="number"
                    min="0"
                    {...form.register("position", { valueAsNumber: true })}
                    data-testid="input-position"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Switch
                      checked={form.watch("isActive")}
                      onCheckedChange={(checked) => form.setValue("isActive", checked)}
                      data-testid="switch-active"
                    />
                    نشط
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Button & Action */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الزر والإجراء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buttonText">نص الزر *</Label>
                <Input
                  id="buttonText"
                  {...form.register("buttonText")}
                  placeholder="تفاعل الآن"
                  data-testid="input-button-text"
                />
                {form.formState.errors.buttonText && (
                  <p className="text-sm text-red-600">{form.formState.errors.buttonText.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buttonAction">نوع الإجراء</Label>
                <Select 
                  value={form.watch("buttonAction")} 
                  onValueChange={(value) => form.setValue("buttonAction", value as "link" | "modal" | "action")}
                >
                  <SelectTrigger data-testid="select-button-action">
                    <SelectValue placeholder="اختر نوع الإجراء" />
                  </SelectTrigger>
                  <SelectContent>
                    {buttonActionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buttonUrl">رابط الإجراء</Label>
                <Input
                  id="buttonUrl"
                  {...form.register("buttonUrl")}
                  placeholder="https://example.com أو /page"
                  data-testid="input-button-url"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">لون الخلفية</Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    {...form.register("backgroundColor")}
                    data-testid="input-background-color"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">لون النص</Label>
                  <Input
                    id="textColor"
                    type="color"
                    {...form.register("textColor")}
                    data-testid="input-text-color"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الصورة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">رابط الصورة *</Label>
              <Input
                id="imageUrl"
                {...form.register("imageUrl")}
                placeholder="https://example.com/image.jpg"
                onChange={(e) => handleImageUrlChange(e.target.value)}
                data-testid="input-image-url"
              />
              {form.formState.errors.imageUrl && (
                <p className="text-sm text-red-600">{form.formState.errors.imageUrl.message}</p>
              )}
              <p className="text-sm text-gray-500">
                يمكنك استخدام روابط من Unsplash أو Cloudinary أو أي مصدر آخر
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? "جاري الحفظ..." : announcement ? "تحديث الإعلان" : "إنشاء الإعلان"}
          </Button>
        </div>
      </form>
    </div>
  );
}