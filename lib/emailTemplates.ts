type ConfirmTemplateArgs = {
  confirmUrl: string;
};

type DigestTemplateArgs = {
  previewText: string;
  items: Array<{ title: string; company: string; location?: string; url?: string }>;
  unsubscribeUrl: string;
};

const baseStyles = `
  font-family: Arial, sans-serif;
  color: #e2e8f0;
  background: #0f172a;
  padding: 32px;
`;

const cardStyles = `
  max-width: 560px;
  margin: 0 auto;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 28px;
`;

const buttonStyles = `
  display: inline-block;
  padding: 12px 18px;
  background: #22d3ee;
  color: #0f172a;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
`;

export function confirmSubscriptionEmail({ confirmUrl }: ConfirmTemplateArgs) {
  return `
    <div style="${baseStyles}">
      <div style="${cardStyles}">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.3em; color: #67e8f9;">
          Rezoomind Alerts
        </p>
        <h2 style="margin-top: 12px;">Confirm your subscription</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          One last step. Click below to confirm you want verified internship alerts.
        </p>
        <div style="margin-top: 20px;">
          <a href="${confirmUrl}" style="${buttonStyles}">Confirm Subscription</a>
        </div>
        <p style="margin-top: 20px; color: #64748b; font-size: 12px;">
          If you didn’t request this, you can ignore this email.
        </p>
      </div>
    </div>
  `;
}

export function welcomeSubscriptionEmail({ unsubscribeUrl }: { unsubscribeUrl: string }) {
  return `
    <div style="${baseStyles}">
      <div style="${cardStyles}">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.3em; color: #67e8f9;">
          Rezoomind Alerts
        </p>
        <h2 style="margin-top: 12px;">You're subscribed</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          Thanks for confirming. You'll receive verified internship alerts and weekly digests.
        </p>
        <p style="margin-top: 24px; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;
}

export function weeklyDigestEmail({ previewText, items, unsubscribeUrl }: DigestTemplateArgs) {
  const listItems = items
    .map(
      (item) => `
        <li style="margin-bottom: 12px;">
          <strong>${item.title}</strong> · ${item.company}
          ${item.location ? `<div style="color: #94a3b8; font-size: 12px;">${item.location}</div>` : ""}
          ${item.url ? `<div><a href="${item.url}" style="color:#22d3ee;">View role</a></div>` : ""}
        </li>
      `
    )
    .join("");

  return `
    <div style="${baseStyles}">
      <div style="${cardStyles}">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.3em; color: #67e8f9;">
          Weekly Digest
        </p>
        <h2 style="margin-top: 12px;">${previewText}</h2>
        <ul style="padding-left: 18px; color: #e2e8f0; line-height: 1.6;">
          ${listItems}
        </ul>
        <p style="margin-top: 24px; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;
}
