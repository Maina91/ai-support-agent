import { z } from 'zod';
import nodemailer from 'nodemailer';
import { Tool, ToolResult } from './types.js';
import config from '../config/index.js';

/**
 * Tool for sending emails
 */
export class EmailTool implements Tool {
  name = 'send_email';
  description = 'Sends an email to a specified recipient';
  
  schema = z.object({
    to: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject cannot be empty'),
    body: z.string().min(1, 'Email body cannot be empty'),
    cc: z.string().email('Invalid CC email address').optional(),
    bcc: z.string().email('Invalid BCC email address').optional(),
  });
  
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
  }
  
  async execute(params: Record<string, any>): Promise<ToolResult> {
    try {
      // Validate parameters
      const validatedParams = this.schema.parse(params);
      
      // Send email
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to: validatedParams.to,
        cc: validatedParams.cc,
        bcc: validatedParams.bcc,
        subject: validatedParams.subject,
        text: validatedParams.body,
        // Could add HTML version too if needed
      });
      
      return {
        success: true,
        result: `Email sent successfully: ${info.messageId}`,
        metadata: {
          messageId: info.messageId,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error sending email:', error);
      
      return {
        success: false,
        result: 'Failed to send email',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}