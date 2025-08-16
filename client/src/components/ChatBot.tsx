import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageCircle, Send, X, Bot, User, Loader2
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatBotProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export function ChatBot({ onClose, isOpen = false }: ChatBotProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي في اطبعلي. كيف يمكنني مساعدتك اليوم؟ يمكنني الإجابة على أسئلتك حول الطلبات، المنتجات، أو أي استفسار آخر.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, sessionId, userId }: { message: string; sessionId: string; userId?: string }) => {
      return apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          sessionId,
          userId,
          messages: messages.slice(-10) // Send last 10 messages for context
        })
      });
    },
    onSuccess: (response: any) => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message || response.reply || 'عذراً، حدث خطأ في الاستجابة',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      console.error('Chat error:', error);
    }
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    await sendMessageMutation.mutateAsync({
      message: userMessage.content,
      sessionId,
      userId: user?.id
    });
  };

  const quickQuestions = [
    'متى يوصل طلبي؟',
    'ما هي طرق الدفع المتاحة؟',
    'كيف يمكنني تتبع طلبي؟',
    'ما هي تكلفة الطباعة؟',
    'كيف يمكنني إلغاء طلبي؟'
  ];

  const handleQuickQuestion = (question: string) => {
    setNewMessage(question);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700 shadow-lg"
          data-testid="button-open-chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw]">
      <Card className="shadow-2xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Bot className="w-5 h-5" />
              <CardTitle className="text-lg">مساعد اطبعلي</CardTitle>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Badge variant="secondary" className="bg-green-800 text-green-100 text-xs">
                متصل
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
                className="text-white hover:bg-green-800 h-8 w-8 p-0"
                data-testid="button-close-chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages Area */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-green-600 text-white ml-2'
                      : 'bg-white border shadow-sm mr-2'
                  }`}
                >
                  <div className="flex items-start space-x-2 space-x-reverse">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-4 h-4 text-green-100 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm rounded-lg p-3 mr-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Bot className="w-4 h-4 text-green-600" />
                    <div className="flex items-center space-x-1">
                      <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                      <span className="text-sm text-gray-600">يكتب...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="p-3 border-t bg-white">
              <p className="text-xs text-gray-600 mb-2">أسئلة شائعة:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs h-7 px-2"
                    data-testid={`button-quick-question-${index}`}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t bg-white">
            <form onSubmit={handleSendMessage} className="flex space-x-2 space-x-reverse">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 text-right"
                disabled={sendMessageMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="bg-green-600 hover:bg-green-700 px-3"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChatBot;