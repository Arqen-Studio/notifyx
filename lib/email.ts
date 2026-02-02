export async function sendReminderEmail(
  to: string,
  taskTitle: string,
  deadlineAt: Date,
  notes: string | null,
  tags: Array<{ name: string }>,
  intervalLabel: string
) {
  const deadlineStr = deadlineAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tagsStr = tags.length > 0 ? tags.map((t) => t.name).join(", ") : "None";

  const subject = `Reminder: ${taskTitle} - ${intervalLabel}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4f064f; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .task-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .deadline { font-size: 18px; color: #d32f2f; font-weight: bold; margin: 15px 0; }
        .section { margin: 15px 0; }
        .label { font-weight: bold; color: #666; }
        .tags { display: inline-block; background-color: #e0e0e0; padding: 4px 8px; border-radius: 4px; margin: 2px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Task Reminder</h1>
        </div>
        <div class="content">
          <div class="task-title">${taskTitle}</div>
          <div class="deadline">Deadline: ${deadlineStr}</div>
          ${notes ? `<div class="section"><div class="label">Notes:</div><div>${notes}</div></div>` : ""}
          <div class="section">
            <div class="label">Tags:</div>
            <div>${tagsStr}</div>
          </div>
          <div class="section">
            <p><strong>This is a ${intervalLabel} reminder.</strong></p>
            <p>Please ensure this task is completed by the deadline.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Task Reminder: ${taskTitle}

Deadline: ${deadlineStr}
${notes ? `Notes: ${notes}` : ""}
Tags: ${tagsStr}

This is a ${intervalLabel} reminder.
Please ensure this task is completed by the deadline.
  `;

  if (process.env.EMAIL_PROVIDER === "console") {
    console.log("=== EMAIL REMINDER ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${textBody}`);
    console.log("=====================");
    return { success: true, messageId: `console-${Date.now()}` };
  }

  if (process.env.EMAIL_PROVIDER === "nodemailer" && process.env.SMTP_HOST) {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { success: true, messageId: info.messageId };
  }

  return { success: false, error: "Email provider not configured" };
}
