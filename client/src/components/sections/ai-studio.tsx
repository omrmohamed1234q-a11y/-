import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  actions?: Array<{
    id: string;
    label: string;
    action: string;
  }>;
}

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'bot',
    content: 'مرحباً! كيف يمكنني مساعدتك في الطباعة اليوم؟',
    timestamp: new Date(),
  },
  {
    id: '2',
    type: 'user',
    content: 'أريد طباعة ملاحظاتي في الأحياء A5 وجهين',
    timestamp: new Date(),
  },
  {
    id: '3',
    type: 'bot',
    content: 'ممتاز! سأساعدك في إعداد طباعة A5 على وجهين. هل تريد:',
    timestamp: new Date(),
    actions: [
      { id: 'quick-print', label: 'طباعة فورية', action: 'quick_print' },
      { id: 'schedule-print', label: 'جدولة الطباعة', action: 'schedule_print' },
      { id: 'preview-first', label: 'معاينة أولاً', action: 'preview_first' },
    ],
  },
];

const quickActions = [
  { id: 'quickPrint', label: 'طباعة سريعة', preset: 'quick_print' },
  { id: 'scan', label: 'مسح ضوئي', preset: 'scan' },
  { id: 'pdfTools', label: 'أدوات PDF', preset: 'pdf_tools' },
  { id: 'templates', label: 'القوالب', preset: 'templates' },
];

export default function AIStudio() {
  const [templateType, setTemplateType] = useState('');
  const [customizationRequest, setCustomizationRequest] = useState('');
  const [language, setLanguage] = useState('arabic');
  const [paperSize, setPaperSize] = useState('A4');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTemplate = async () => {
    if (!templateType || !customizationRequest.trim()) {
      return;
    }

    setIsGenerating(true);
    
    // TODO: Implement AI template generation via Supabase Edge Functions
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Generating template:', {
        type: templateType,
        customization: customizationRequest,
        language,
        paperSize,
      });
      
      // TODO: Save generated template to Supabase and provide download link
      
    } catch (error) {
      console.error('Template generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // TODO: Send to AI chat API and get response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'شكراً لرسالتك! سأقوم بمعالجة طلبك...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleQuickAction = (preset: string) => {
    // TODO: Handle quick action presets
    console.log('Quick action:', preset);
  };

  const handleActionClick = (actionId: string, action: string) => {
    // TODO: Handle chat action buttons
    console.log('Action clicked:', actionId, action);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-100 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center ml-3">
                <i className="fas fa-brain text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-indigo-900">استوديو الذكاء الاصطناعي</h2>
                <p className="text-sm text-indigo-700">إنشاء وتخصيص القوالب بتقنية الذكاء الاصطناعي</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              جديد
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Template Generator */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <i className="fas fa-magic text-indigo-600 ml-2"></i>
                  مولد القوالب الذكي
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-type">نوع القالب</Label>
                    <Select value={templateType} onValueChange={setTemplateType}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع القالب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="schedule">جدول دراسي</SelectItem>
                        <SelectItem value="organizer">منظم مهام</SelectItem>
                        <SelectItem value="flashcards">كروت الفلاش</SelectItem>
                        <SelectItem value="checklist">قائمة مراجعة</SelectItem>
                        <SelectItem value="weekly-plan">خطة أسبوعية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="customization">وصف التخصيص</Label>
                    <Textarea 
                      id="customization"
                      placeholder="مثال: أريد جدول دراسي لطالب ثانوي يدرس 6 مواد، مع مساحة للملاحظات..."
                      value={customizationRequest}
                      onChange={(e) => setCustomizationRequest(e.target.value)}
                      className="h-24 resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language">اللغة</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arabic">العربية</SelectItem>
                          <SelectItem value="english">الإنجليزية</SelectItem>
                          <SelectItem value="both">الاثنان معاً</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paper-size">حجم الورق</Label>
                      <Select value={paperSize} onValueChange={setPaperSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="A5">A5</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white"
                    onClick={handleGenerateTemplate}
                    disabled={isGenerating || !templateType || !customizationRequest.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sparkles ml-2"></i>
                        إنشاء القالب بالذكاء الاصطناعي
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Smart Chat Assistant */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <i className="fas fa-comments text-purple-600 ml-2"></i>
                  مساعد الطباعة الذكي
                </h3>
                
                {/* Chat Messages */}
                <div className="border border-border rounded-lg p-4 h-64 overflow-y-auto mb-4 scrollbar-thin">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 space-x-reverse ${
                          message.type === 'user' ? 'justify-end' : ''
                        }`}
                      >
                        {message.type === 'bot' && (
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-robot text-purple-600 text-sm"></i>
                          </div>
                        )}
                        
                        <div className={`max-w-xs ${
                          message.type === 'user' 
                            ? 'bg-indigo-600 text-white p-3 rounded-lg rounded-tl-none' 
                            : 'bg-secondary p-3 rounded-lg rounded-tr-none'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          {message.actions && (
                            <div className="mt-2 space-y-1">
                              {message.actions.map((action) => (
                                <Button
                                  key={action.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-right text-xs justify-start"
                                  onClick={() => handleActionClick(action.id, action.action)}
                                >
                                  • {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {message.type === 'user' && (
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-user text-indigo-600 text-sm"></i>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Chat Input */}
                <div className="flex space-x-2 space-x-reverse">
                  <Input
                    placeholder="اكتب رسالتك هنا..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3"
                    onClick={handleSendMessage}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                      onClick={() => handleQuickAction(action.preset)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
