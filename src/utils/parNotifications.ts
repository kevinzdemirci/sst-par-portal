/**
 * PAR email notifications. Every message is sent through the district Google Apps Script,
 * so it comes from sstpar@ssttx.org, and uses one SST template.
 *
 * Emails carry only what a recipient needs to act (tracking number, employee, campus,
 * request type, dates, current step). Salaries, separation reasons, and medical details
 * stay in the portal.
 */
import { ApprovalStep, DepartmentNotificationRecord, PersonnelActionRequest, UserPersona } from '../types/par';
import { sendGmailEmail } from './gmailService';
import { getDistrictEmailCredentials } from './emailChannel';
import { formatDate, getActionTypeInfo } from './formatters';

export const PORTAL_URL = 'https://sst-par-portal.web.app';
export const NOTIFICATION_SENDER = 'sstpar@ssttx.org';

export const parLink = (par: PersonnelActionRequest) => `${PORTAL_URL}/?par=${encodeURIComponent(par.trackingNumber)}`;

type Tone = 'action' | 'info' | 'success' | 'warning' | 'danger';

export interface ParEmail {
  to: string;
  toName: string;
  subject: string;
  bodyText: string;
  htmlBody: string;
  category: 'notification' | 'approval' | 'rejection' | 'completion';
}

interface EmailContent {
  subject: string;
  badge: string;
  tone: Tone;
  heading: string;
  greetingName: string;
  paragraphs: string[];
  details: [string, string][];
  actionLabel?: string;
  actionUrl?: string;
  note?: string;
}

const TONES: Record<Tone, { bg: string; fg: string }> = {
  action: { bg: '#fef3c7', fg: '#92400e' },
  info: { bg: '#e0e7ff', fg: '#1e3a8a' },
  success: { bg: '#d1fae5', fg: '#065f46' },
  warning: { bg: '#ffedd5', fg: '#9a3412' },
  danger: { bg: '#ffe4e6', fg: '#9f1239' }
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renders the SST email template (table layout and inline styles for Gmail and Outlook). */
export function renderParEmail(c: EmailContent): { subject: string; bodyText: string; htmlBody: string } {
  const tone = TONES[c.tone];
  const rows = c.details
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');
  const button = c.actionUrl
    ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
          <tr><td style="background:#0f2352;border-radius:8px;">
            <a href="${c.actionUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(c.actionLabel || 'Open in the PAR Portal')}</a>
          </td></tr>
        </table>
        <p style="margin:0;color:#64748b;font-size:12px;">Sign in with your district Google account. If the button does not work, open ${PORTAL_URL}.</p>`
    : '';

  const htmlBody = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f1f5f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr><td style="background:#0f2352;padding:18px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><img src="${PORTAL_URL}/sst-logo.jpg" alt="School of Science and Technology" height="44" style="display:block;background:#ffffff;border-radius:6px;padding:4px;"></td>
          <td align="right" style="color:#c7d2fe;font-size:12px;font-weight:600;letter-spacing:0.5px;">PERSONNEL ACTION REQUEST</td>
        </tr></table>
      </td></tr>
      <tr><td style="height:4px;background:#b91c1c;line-height:4px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:28px;">
        <span style="display:inline-block;background:${tone.bg};color:${tone.fg};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:4px 10px;border-radius:999px;">${escapeHtml(c.badge)}</span>
        <h1 style="margin:14px 0 16px;color:#0f172a;font-size:20px;line-height:1.3;">${escapeHtml(c.heading)}</h1>
        <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6;">Hello ${escapeHtml(c.greetingName)},</p>
        ${c.paragraphs.map(p => `<p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6;">${escapeHtml(p)}</p>`).join('')}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 4px;border-top:1px solid #e2e8f0;">${rows}</table>
        ${button}
        ${c.note ? `<p style="margin:20px 0 0;padding:12px 14px;background:#f8fafc;border-left:3px solid #0f2352;color:#334155;font-size:13px;line-height:1.5;">${escapeHtml(c.note)}</p>` : ''}
      </td></tr>
      <tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.6;">
        School of Science and Technology · Human Resources<br>
        Sent automatically by the SST PAR Portal from ${NOTIFICATION_SENDER}. This message contains confidential personnel information; do not forward it outside the district.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const bodyText = [
    `${c.badge.toUpperCase()}: ${c.heading}`,
    '',
    `Hello ${c.greetingName},`,
    '',
    ...c.paragraphs.flatMap(p => [p, '']),
    ...c.details.map(([label, value]) => `${label}: ${value}`),
    '',
    c.actionUrl ? `${c.actionLabel || 'Open in the PAR Portal'}: ${c.actionUrl}` : '',
    c.note ? `\n${c.note}` : '',
    '',
    `School of Science and Technology Human Resources (sent from ${NOTIFICATION_SENDER})`
  ].join('\n');

  return { subject: c.subject, bodyText, htmlBody };
}

const employeeName = (par: PersonnelActionRequest) => `${par.firstName} ${par.lastName}`.trim();

function parDetails(par: PersonnelActionRequest, currentStep?: string): [string, string][] {
  const rows: [string, string][] = [
    ['Tracking number', par.trackingNumber],
    ['Request type', getActionTypeInfo(par.actionType).label],
    ['Employee', employeeName(par)],
    ['Position ID', par.employeeId],
    ['Campus', par.campus],
    ['Effective date', formatDate(par.effectiveDate)],
    ['Submitted by', par.submittedBy]
  ];
  if (currentStep) rows.push(['Current step', currentStep]);
  return rows;
}

const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

function email(to: string, toName: string, category: ParEmail['category'], content: EmailContent): ParEmail {
  return { to, toName, category, ...renderParEmail(content) };
}

/** "Your action is needed" for the person assigned to a step. */
function actionNeeded(par: PersonnelActionRequest, step: ApprovalStep, lead: string): ParEmail {
  return email(step.assignedEmail, step.assignedName || step.assignedRole, 'approval', {
    subject: `Action needed: ${getActionTypeInfo(par.actionType).label} for ${employeeName(par)} (${par.trackingNumber})`,
    badge: 'Action needed',
    tone: 'action',
    heading: `Please review and sign: ${step.stageLabel}`,
    greetingName: step.assignedName || step.assignedRole,
    paragraphs: [lead, 'Please review the request in the PAR Portal and approve it, return it for revision, or reject it.'],
    details: parDetails(par, step.stageLabel),
    actionLabel: 'Review and sign',
    actionUrl: parLink(par)
  });
}

function departmentNotice(par: PersonnelActionRequest, dept: DepartmentNotificationRecord): ParEmail {
  if (dept.type === 'dps') {
    return email(dept.recipientEmail, dept.recipientName, 'notification', {
      subject: `Action needed: DPS unsubscribe for ${employeeName(par)} (${par.trackingNumber})`,
      badge: 'Action needed',
      tone: 'action',
      heading: 'Remove this employee from the DPS fingerprint subscription',
      greetingName: dept.recipientName,
      paragraphs: [
        `A separation PAR was submitted for ${employeeName(par)}. Please remove the employee's fingerprint subscription from the DPS system after the separation date.`
      ],
      details: [
        ...parDetails(par),
        ['DPS SID', par.dpsSid || 'Not recorded on the PAR (check ADP)'],
        ['Last day worked', formatDate(par.lastDayWorked)]
      ]
    });
  }
  return email(dept.recipientEmail, dept.recipientName, 'notification', {
    subject: `FYI: ${getActionTypeInfo(par.actionType).label} for ${employeeName(par)} (${par.trackingNumber})`,
    badge: 'For your information',
    tone: 'info',
    heading: `${dept.department}: upcoming personnel change`,
    greetingName: dept.recipientName,
    paragraphs: [`A Personnel Action Request was submitted that affects your area: ${dept.purpose}.`, 'No approval is needed from you.'],
    details: parDetails(par)
  });
}

/** Emails to send when a PAR is submitted. */
export function buildSubmissionEmails(par: PersonnelActionRequest): ParEmail[] {
  const out: ParEmail[] = [];
  const next = par.routingSteps.find(s => s.status === 'pending');
  if (next?.assignedEmail && !same(next.assignedEmail, par.submitterEmail)) {
    out.push(actionNeeded(par, next, `${par.submittedBy} submitted a Personnel Action Request that now needs your signature.`));
  }
  if (par.submitterEmail) {
    out.push(
      email(par.submitterEmail, par.submittedBy, 'notification', {
        subject: `Submitted: ${getActionTypeInfo(par.actionType).label} for ${employeeName(par)} (${par.trackingNumber})`,
        badge: 'Submitted',
        tone: 'info',
        heading: 'Your Personnel Action Request was submitted',
        greetingName: par.submittedBy,
        paragraphs: [
          next
            ? `It is now with ${next.assignedName ? `${next.assignedName} (${next.assignedRole})` : next.assignedRole} for ${next.stageLabel}. You will receive an email when it is completed, or if it is returned to you.`
            : 'It has no further approval steps.'
        ],
        details: parDetails(par, next?.stageLabel),
        actionLabel: 'View your PAR',
        actionUrl: parLink(par)
      })
    );
  }
  (par.departmentNotifications || []).forEach(dept => out.push(departmentNotice(par, dept)));
  return out;
}

/** Emails to send after an approval: the next approver, or the submitter when complete. */
export function buildApprovalEmails(par: PersonnelActionRequest, approver: UserPersona): ParEmail[] {
  const next = par.routingSteps.find(s => s.status === 'pending');
  if (next) {
    if (!next.assignedEmail || same(next.assignedEmail, approver.email)) return [];
    return [actionNeeded(par, next, `${approver.name} (${approver.role}) approved this request. It now needs your signature.`)];
  }
  if (!par.submitterEmail) return [];
  return [
    email(par.submitterEmail, par.submittedBy, 'completion', {
      subject: `Completed: ${getActionTypeInfo(par.actionType).label} for ${employeeName(par)} (${par.trackingNumber})`,
      badge: 'Completed',
      tone: 'success',
      heading: 'Your Personnel Action Request is complete',
      greetingName: par.submittedBy,
      paragraphs: ['All approvals are signed. Payroll has completed its step in ADP Workforce Now.'],
      details: parDetails(par, 'Completed'),
      actionLabel: 'View the PAR',
      actionUrl: parLink(par)
    })
  ];
}

/** Email to the submitter when a PAR is returned for revision (they must act). */
export function buildReturnedEmails(par: PersonnelActionRequest, reviewer: UserPersona, comments: string): ParEmail[] {
  if (!par.submitterEmail) return [];
  return [
    email(par.submitterEmail, par.submittedBy, 'notification', {
      subject: `Action needed: revise ${par.trackingNumber} for ${employeeName(par)}`,
      badge: 'Returned for revision',
      tone: 'warning',
      heading: 'Your Personnel Action Request needs changes',
      greetingName: par.submittedBy,
      paragraphs: [`${reviewer.name} (${reviewer.role}) returned this request. Please update it in the PAR Portal and resubmit.`],
      details: parDetails(par, 'Returned for revision'),
      actionLabel: 'Revise the PAR',
      actionUrl: parLink(par),
      note: comments ? `Reviewer's note: ${comments}` : undefined
    })
  ];
}

/** Email to the submitter when a PAR is rejected. */
export function buildRejectedEmails(par: PersonnelActionRequest, reviewer: UserPersona, comments: string): ParEmail[] {
  if (!par.submitterEmail) return [];
  return [
    email(par.submitterEmail, par.submittedBy, 'rejection', {
      subject: `Not approved: ${getActionTypeInfo(par.actionType).label} for ${employeeName(par)} (${par.trackingNumber})`,
      badge: 'Not approved',
      tone: 'danger',
      heading: 'Your Personnel Action Request was not approved',
      greetingName: par.submittedBy,
      paragraphs: [`${reviewer.name} (${reviewer.role}) rejected this request. Contact Human Resources if you have questions.`],
      details: parDetails(par, 'Rejected'),
      actionLabel: 'View the PAR',
      actionUrl: parLink(par),
      note: comments ? `Reviewer's note: ${comments}` : undefined
    })
  ];
}

/** Sends emails through the district Apps Script (from sstpar@ssttx.org). Failures are logged. */
export function sendParEmails(emails: ParEmail[]): void {
  const creds = getDistrictEmailCredentials();
  if (!creds.isEnabled) return;
  emails.forEach(e =>
    sendGmailEmail(
      { to: e.to, toName: e.toName, subject: e.subject, bodyText: e.bodyText, htmlBody: e.htmlBody, category: e.category },
      creds
    ).catch(err => console.error(`PAR email to ${e.to} failed:`, err))
  );
}
