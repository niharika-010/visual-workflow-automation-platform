import { BaseNode } from './baseNode.js';
import nodemailer from 'nodemailer';
import { getCredentialById } from '../../models/credential.model.js';

export class EmailNode extends BaseNode {
  constructor() {
    super('email');
  }

  async execute(context) {
    const { config = {} } = context;
    const { to, subject, body, credentialId, isHtml } = config;

    let smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (credentialId) {
      const cred = await getCredentialById(credentialId);
      if (cred && cred.data) {
        smtpConfig = {
          host: cred.data.host || smtpConfig.host,
          port: cred.data.port || smtpConfig.port,
          secure: cred.data.secure || false,
          auth: {
            user: cred.data.user || smtpConfig.auth.user,
            pass: cred.data.pass || smtpConfig.auth.pass,
          },
        };
      }
    }

    try {
      if (smtpConfig.auth.user && smtpConfig.auth.pass) {
        const transporter = nodemailer.createTransport(smtpConfig);
        const mailOptions = {
          from: smtpConfig.auth.user,
          to: to || 'recipient@example.com',
          subject: subject || 'Workflow Alert',
          [isHtml ? 'html' : 'text']: body || 'Workflow notification message',
        };

        const info = await transporter.sendMail(mailOptions);
        return {
          success: true,
          data: {
            sent: true,
            messageId: info.messageId,
            to,
            subject,
            deliveredAt: new Date().toISOString(),
          },
        };
      }

      // Mock fallback if SMTP credentials not provided in environment
      return {
        success: true,
        data: {
          sent: true,
          mode: 'mock',
          to: to || 'user@example.com',
          subject: subject || 'Workflow Alert',
          body: body || 'Execution notification',
          deliveredAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `Email delivery failed: ${err.message}`,
        data: { error: err.message },
      };
    }
  }
}
