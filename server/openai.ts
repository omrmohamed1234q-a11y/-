import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatResponse(message: string, context?: any[]): Promise<string> {
  try {
    const systemPrompt = `أنت مساعد ذكي لمنصة "اطبعلي" - منصة الطباعة والخدمات التعليمية العربية. 

مهامك:
- مساعدة العملاء في استفساراتهم حول الطلبات والمنتجات
- تقديم معلومات عن أوقات التسليم وحالة الطلبات
- شرح خدمات الطباعة والأسعار
- مساعدة المعلمين في نظام الاشتراكات
- الرد بطريقة ودودة ومهنية باللغة العربية

معلومات المنصة:
- خدمات الطباعة متاحة للمستندات والكتب
- أوقات التسليم: عادة 2-3 أيام عمل
- نقبل الدفع نقدا عند التسليم أو بالبطاقات
- لدينا نظام نقاط مكافآت للعملاء
- نقدم اشتراكات خاصة للمعلمين لرفع المواد التعليمية

إذا سُئلت عن:
- حالة طلب معين: اطلب رقم الطلب وأخبرهم أنه يمكن تتبعه من الحساب
- الأسعار: أسعار الطباعة تبدأ من 0.10 ر.س للصفحة الواحدة
- التسليم: عادة خلال 2-3 أيام عمل
- المشاكل التقنية: انصحهم بالتواصل مع الدعم الفني

كن مفيدا ومساعدا ولا تتردد في طرح أسئلة توضيحية.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add context if available
    if (context && context.length > 0) {
      messages.push(...context);
    }

    messages.push({ role: 'user', content: message });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.6,
    });

    return response.choices[0].message.content || 'عذراً، لم أتمكن من فهم استفسارك. يرجى إعادة الصياغة.';
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('حدث خطأ في النظام. يرجى المحاولة مرة أخرى.');
  }
}

export { openai };