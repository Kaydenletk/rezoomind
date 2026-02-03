import { Resend } from "resend";

import { confirmSubscriptionEmail, weeklyDigestEmail, welcomeSubscriptionEmail } from "@/lib/emailTemplates";

let resendClient: Resend | null = null;

const getClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const getFrom = () => {
  const from = process.env.RESEND_FROM;
  if (!from) {
    throw new Error("RESEND_FROM is not set");
  }
  return from;
};

export async function sendConfirmEmail(email: string, confirmUrl: string) {
  const client = getClient();
  const from = getFrom();
  const { error } = await client.emails.send({
    from,
    to: [email],
    subject: "Confirm your Rezoomind subscription",
    html: confirmSubscriptionEmail({ confirmUrl }),
  });
  if (error) {
    throw new Error(error.message || "Resend failed to send confirm email");
  }
}

export async function sendWelcomeEmail(email: string, unsubscribeUrl: string) {
  const client = getClient();
  const from = getFrom();
  const { error } = await client.emails.send({
    from,
    to: [email],
    subject: "You're subscribed to Rezoomind internship alerts",
    html: welcomeSubscriptionEmail({ unsubscribeUrl }),
  });
  if (error) {
    throw new Error(error.message || "Resend failed to send welcome email");
  }
}

export async function sendJobAlertEmail(
  email: string,
  items: Array<{ title: string; company: string; location?: string; url?: string }>,
  unsubscribeUrl: string
) {
  const client = getClient();
  const from = getFrom();
  const { error } = await client.emails.send({
    from,
    to: [email],
    subject: "New internship alerts from Rezoomind",
    html: weeklyDigestEmail({
      previewText: "New roles matched to your interests",
      items,
      unsubscribeUrl,
    }),
  });
  if (error) {
    throw new Error(error.message || "Resend failed to send job alert email");
  }
}
