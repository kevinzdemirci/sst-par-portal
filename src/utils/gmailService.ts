/**
 * SST Gmail & Google Workspace Automated Dispatch Service
 * Enables sending account activation invites, IT/TA notifications, and CPO alerts
 * directly from an SST Gmail / Google Workspace address.
 */

export interface GmailCredentials {
  senderEmail: string;              // e.g. "hr@ssttx.org" or "kevinzdemirci@gmail.com"
  senderName: string;               // e.g. "School of Science and Technology HR"
  mode: 'google_script' | 'emailjs' | 'smtp_relay';
  scriptUrl?: string;               // Google Apps Script Web App URL
  emailJsServiceId?: string;        // EmailJS Gmail Service ID
  emailJsTemplateId?: string;       // EmailJS Template ID
  emailJsPublicKey?: string;        // EmailJS Public Key
  smtpEndpoint?: string;            // Custom SMTP / Relay webhook URL
  smtpToken?: string;               // Secret token or App Password
  ccHrCopy: boolean;                // Automatically CC the district HR office
  hrEmail: string;                  // e.g. "hr@ssttx.org"
  isEnabled: boolean;               // Enable/disable automated dispatch
  lastTestStatus?: 'success' | 'failed' | null;
  lastTestMessage?: string;
  lastTestedAt?: string;
}

export interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  bodyText: string;
  htmlBody?: string;
  cc?: string;
  category?: 'activation' | 'notification' | 'payout' | 'test';
}

export interface SendResult {
  success: boolean;
  message: string;
  provider?: string;
  timestamp: string;
}

export const GMAIL_STORAGE_KEY = 'sst_gmail_credentials_v1';

export const DEFAULT_GMAIL_CREDENTIALS: GmailCredentials = {
  senderEmail: 'hr@ssttx.org',
  senderName: 'School of Science and Technology HR',
  mode: 'google_script',
  scriptUrl: '',
  emailJsServiceId: '',
  emailJsTemplateId: '',
  emailJsPublicKey: '',
  smtpEndpoint: '',
  smtpToken: '',
  ccHrCopy: true,
  hrEmail: 'hr@ssttx.org',
  isEnabled: false
};

/**
 * Ready-to-copy Google Apps Script that runs inside the user's Gmail / Google Workspace.
 * When deployed as a Web App, it uses GmailApp.sendEmail to dispatch emails
 * authenticated from the user's Gmail address with zero setup fees.
 */
export const GOOGLE_APPS_SCRIPT_SAMPLE = `/**
 * Google Apps Script — SST Gmail Dispatcher Web App
 * Deploy steps:
 * 1. Open https://script.google.com and create a New Project
 * 2. Paste this code into Code.gs
 * 3. Click Deploy > New deployment > Select type: Web app
 * 4. Execute as: "Me (your Gmail account)"
 * 5. Who has access: "Anyone"
 * 6. Click Deploy, authorize permissions, and copy the Web App URL into the SST Portal.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = data.to;
    var subject = data.subject || "SST Notification";
    var body = data.bodyText || data.body || "";
    var htmlBody = data.htmlBody || body.replace(/\\n/g, "<br>");
    var senderName = data.senderName || "School of Science and Technology HR";
    var cc = data.cc || "";

    var options = {
      name: senderName,
      htmlBody: htmlBody
    };
    if (cc) {
      options.cc = cc;
    }

    GmailApp.sendEmail(to, subject, body, options);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Email sent successfully via Gmail to " + to
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "SST Gmail Dispatcher",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}`;

/**
 * Load saved credentials from localStorage
 */
export function getStoredGmailCredentials(): GmailCredentials {
  try {
    const saved = localStorage.getItem(GMAIL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_GMAIL_CREDENTIALS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading stored Gmail credentials:', e);
  }
  return DEFAULT_GMAIL_CREDENTIALS;
}

/**
 * Save credentials to localStorage
 */
export function saveGmailCredentials(creds: GmailCredentials): void {
  try {
    localStorage.setItem(GMAIL_STORAGE_KEY, JSON.stringify(creds));
  } catch (e) {
    console.error('Error saving Gmail credentials:', e);
  }
}

/**
 * Format plain-text message into professional SST HTML email template
 */
export function buildSstHtmlEmail(title: string, bodyText: string, actionUrl?: string, actionLabel?: string): string {
  const formattedBody = bodyText
    .split('\n\n')
    .map(p => `<p style="margin: 0 0 16px; line-height: 1.6; color: #334155; font-size: 14px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const actionButton = actionUrl ? `
    <div style="margin: 28px 0; text-align: center;">
      <a href="${actionUrl}" style="background-color: #0f2352; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(15, 35, 82, 0.2);">
        ${actionLabel || 'Access SST Portal'} &rarr;
      </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <tr>
          <td style="background-color: #0f2352; padding: 24px 32px; text-align: left;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <div style="color: #fbbf24; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
                    School of Science and Technology
                  </div>
                  <div style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.5px;">
                    Personnel Action Request & HR Portal
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding: 32px;">
            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 800; color: #0f2352; letter-spacing: -0.3px;">
              ${title}
            </h2>
            ${formattedBody}
            ${actionButton}
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 20px;">
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size: 11px; color: #64748b; line-height: 1.5;">
                  <strong>Confidentiality Notice:</strong> This message and any attachments are intended exclusively for authorized School of Science and Technology personnel. If received in error, please contact <a href="mailto:hr@ssttx.org" style="color: #0f2352;">hr@ssttx.org</a> immediately.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f1f5f9; padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 500;">
              School of Science and Technology Charter District &bull; Human Capital Systems
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Dispatch an email via the configured Gmail method
 */
export async function sendGmailEmail(
  payload: EmailPayload,
  customCreds?: GmailCredentials
): Promise<SendResult> {
  const creds = customCreds || getStoredGmailCredentials();
  const timestamp = new Date().toISOString();

  // Basic validation
  if (!payload.to || !payload.to.includes('@')) {
    return {
      success: false,
      message: 'Invalid recipient email address.',
      timestamp
    };
  }

  // Ensure HTML body exists
  const finalHtml = payload.htmlBody || buildSstHtmlEmail(payload.subject, payload.bodyText);
  const finalCc = creds.ccHrCopy && creds.hrEmail ? creds.hrEmail : (payload.cc || '');

  // 1. MODE: Google Apps Script (Recommended for Gmail)
  if (creds.mode === 'google_script') {
    if (!creds.scriptUrl || !creds.scriptUrl.startsWith('http')) {
      return {
        success: false,
        message: 'Google Apps Script Web App URL is missing. Please add your script URL in Gmail Settings.',
        timestamp
      };
    }

    try {
      // Use text/plain to avoid CORS preflight options check on Google Apps Script
      const response = await fetch(creds.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          to: payload.to,
          toName: payload.toName || payload.to,
          subject: payload.subject,
          bodyText: payload.bodyText,
          htmlBody: finalHtml,
          cc: finalCc,
          senderName: creds.senderName,
          senderEmail: creds.senderEmail
        })
      });

      if (response.ok) {
        try {
          const resJson = await response.json();
          if (resJson && resJson.status === 'error') {
            return {
              success: false,
              message: resJson.message || 'Google Script returned an error.',
              provider: 'Google Apps Script (Gmail)',
              timestamp
            };
          }
        } catch {
          // If response is not JSON (e.g. redirect), GmailApp.sendEmail was still invoked
        }

        return {
          success: true,
          message: `Dispatched successfully from ${creds.senderEmail} via Gmail`,
          provider: 'Google Apps Script (Gmail)',
          timestamp
        };
      } else {
        return {
          success: false,
          message: `Google Script endpoint returned HTTP error ${response.status}`,
          provider: 'Google Apps Script (Gmail)',
          timestamp
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Network error reaching Google Apps Script: ${err.message || 'Check Script URL and deployment permissions'}`,
        provider: 'Google Apps Script (Gmail)',
        timestamp
      };
    }
  }

  // 2. MODE: EmailJS (Gmail Service)
  if (creds.mode === 'emailjs') {
    if (!creds.emailJsServiceId || !creds.emailJsPublicKey) {
      return {
        success: false,
        message: 'EmailJS Service ID or Public Key is missing. Please complete setup in Gmail Settings.',
        timestamp
      };
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: creds.emailJsServiceId,
          template_id: creds.emailJsTemplateId || 'default',
          user_id: creds.emailJsPublicKey,
          template_params: {
            to_email: payload.to,
            to_name: payload.toName || payload.to,
            from_name: creds.senderName,
            from_email: creds.senderEmail,
            subject: payload.subject,
            message: payload.bodyText,
            cc_email: finalCc
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Dispatched successfully from ${creds.senderEmail} via EmailJS Gmail`,
          provider: 'EmailJS (Gmail)',
          timestamp
        };
      } else {
        const errText = await response.text();
        return {
          success: false,
          message: `EmailJS error: ${errText || response.statusText}`,
          provider: 'EmailJS (Gmail)',
          timestamp
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `EmailJS connection failed: ${err.message}`,
        provider: 'EmailJS (Gmail)',
        timestamp
      };
    }
  }

  // 3. MODE: SMTP Relay / Webhook
  if (creds.mode === 'smtp_relay') {
    if (!creds.smtpEndpoint || !creds.smtpEndpoint.startsWith('http')) {
      return {
        success: false,
        message: 'SMTP Relay Endpoint URL is missing. Please add your endpoint in Gmail Settings.',
        timestamp
      };
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (creds.smtpToken) {
        headers['Authorization'] = `Bearer ${creds.smtpToken}`;
      }

      const response = await fetch(creds.smtpEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          text: payload.bodyText,
          html: finalHtml,
          from: `"${creds.senderName}" <${creds.senderEmail}>`,
          cc: finalCc
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Dispatched successfully from ${creds.senderEmail} via SMTP Relay`,
          provider: 'SMTP Relay',
          timestamp
        };
      } else {
        return {
          success: false,
          message: `SMTP Relay returned HTTP ${response.status}`,
          provider: 'SMTP Relay',
          timestamp
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `SMTP Relay connection failed: ${err.message}`,
        provider: 'SMTP Relay',
        timestamp
      };
    }
  }

  return {
    success: false,
    message: 'Unknown email dispatch mode selected.',
    timestamp
  };
}
