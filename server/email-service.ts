import { google } from 'googleapis';

interface EmailNotification {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
}

class EmailService {
    private gmail: any;
    private isConfigured: boolean = false;

    constructor() {
        this.initializeGmail();
    }

    private initializeGmail() {
        try {
            // Use the same OAuth client from Google Drive
            const auth = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );

            auth.setCredentials({
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN
            });

            this.gmail = google.gmail({ version: 'v1', auth });
            this.isConfigured = true;
            console.log('✅ Gmail service initialized');
        } catch (error: any) {
            console.error('❌ Failed to initialize Gmail:', error.message);
            this.isConfigured = false;
        }
    }

    /**
     * Send email notification
     */
    async sendEmail(notification: EmailNotification): Promise<boolean> {
        if (!this.isConfigured) {
            console.warn('⚠️ Gmail not configured, skipping email notification');
            return false;
        }

        try {
            // Create email message
            const message = [
                `To: ${notification.to}`,
                'Content-Type: text/html; charset=utf-8',
                'MIME-Version: 1.0',
                `Subject: ${notification.subject}`,
                '',
                notification.body
            ].join('\n');

            // Encode in base64
            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            // Send email
            await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage
                }
            });

            console.log(`✅ Email sent to ${notification.to}`);
            return true;
        } catch (error: any) {
            console.error(`❌ Failed to send email to ${notification.to}:`, error.message);
            return false;
        }
    }

    /**
     * Send new order notification
     */
    async sendNewOrderNotification(orderData: {
        customerName: string;
        orderNumber: string;
        totalAmount: number;
        itemsCount: number;
        date: string;
        driveLink?: string;
    }): Promise<boolean> {
        const subject = `🔔 طلب جديد #${orderData.orderNumber} - ${orderData.customerName}`;

        const body = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { background: white; max-width: 600px; margin: 0 auto; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .info-row { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #666; }
          .info-value { color: #333; }
          .highlight { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 طلب طباعة جديد!</h1>
          </div>
          
          <div class="content">
            <div class="highlight">
              <h2 style="margin-top: 0; color: #667eea;">📋 تفاصيل الطلب</h2>
            </div>
            
            <div class="info-row">
              <span class="info-label">👤 اسم العميل:</span>
              <span class="info-value">${orderData.customerName}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">🔢 رقم الطلب:</span>
              <span class="info-value">#${orderData.orderNumber}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">📅 التاريخ:</span>
              <span class="info-value">${orderData.date}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">📦 عدد الملفات:</span>
              <span class="info-value">${orderData.itemsCount} ملف</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">💰 المبلغ الإجمالي:</span>
              <span class="info-value" style="color: #10b981; font-weight: bold; font-size: 18px;">${orderData.totalAmount} جنيه</span>
            </div>
            
            ${orderData.driveLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderData.driveLink}" class="button">
                  📁 فتح الملفات في Google Drive
                </a>
              </div>
            ` : ''}
            
            <div class="highlight" style="background: #fff3cd; border-left-color: #ffc107; margin-top: 30px;">
              <p style="margin: 0;">
                ⚡ <strong>تنبيه:</strong> طلب جديد يحتاج إلى المراجعة والطباعة
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>هذا إشعار تلقائي من نظام الطباعة</p>
            <p style="color: #ccc;">🖨️ اطبعلي - خدمات الطباعة</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return await this.sendEmail({
            to: 'printformead1@gmail.com',
            subject,
            body,
            isHtml: true
        });
    }
}

// Export singleton instance
export const emailService = new EmailService();
