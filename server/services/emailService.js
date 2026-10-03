const nodemailer = require('nodemailer');

/**
 * Mask Email for Safe Log Outputs (e.g. ud**@gmail.com)
 */
const maskEmail = (emailStr) => {
  if (!emailStr || typeof emailStr !== 'string' || !emailStr.includes('@')) {
    return 'u****@gmail.com';
  }
  const [local, domain] = emailStr.split('@');
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}****` : `${local[0]}****`;
  return `${maskedLocal}@${domain}`;
};

/**
 * Log Redactor: strips sensitive keywords (otp, password, token, secret, pass, key)
 * from any log payload to prevent accidental leaks.
 */
const redactSensitive = (obj) => {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    return obj.replace(/(otp|password|token|secret|pass|key)\s*[:=]\s*['"]?[^'"\s]+['"]?/gi, '$1=[REDACTED]');
  }
  if (typeof obj === 'object') {
    const copy = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
      if (/otp|password|token|secret|pass|key/i.test(k)) {
        copy[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        copy[k] = redactSensitive(v);
      } else {
        copy[k] = v;
      }
    }
    return copy;
  }
  return obj;
};

/**
 * Nodemailer Transporter Factory
 */
const getTransporter = () => {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();
  const host = process.env.SMTP_HOST || (provider === 'sendgrid' ? 'smtp.sendgrid.net' : 'smtp.gmail.com');
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || (provider === 'sendgrid' ? 'apikey' : null);
  // Strip quotes and whitespace
  const user = rawUser ? String(rawUser).replace(/["']/g, '').trim() : null;

  const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_API_KEY;
  // Automatically strip all quotes and spaces from App Passwords
  const pass = rawPass ? String(rawPass).replace(/["'\s]/g, '') : null;

  if (!user || !pass) {
    return null;
  }

  // Use built-in Gmail service configuration when connecting to Gmail SMTP
  if (host.includes('gmail.com') || provider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

/**
 * Startup Validation helper
 */
const validateEmailConfig = () => {
  const provider = process.env.EMAIL_PROVIDER || 'smtp';
  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const user = rawUser ? String(rawUser).replace(/["']/g, '').trim() : null;
  const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_API_KEY;
  const pass = rawPass ? String(rawPass).replace(/["'\s]/g, '') : null;

  if (!user || !pass) {
    console.warn('\n---------------------------------------------------------------');
    console.warn(`⚠️ [EmailService] Real Email delivery is NOT fully configured!`);
    console.warn(`   Provider: ${provider}`);
    console.warn(`   Missing SMTP_USER / SMTP_PASS or GMAIL_USER / GMAIL_APP_PASSWORD in .env`);
    console.warn(`   OTP verification emails will fail until configured.`);
    console.warn('---------------------------------------------------------------\n');
    return false;
  }
  console.log(`[EmailService] Configured successfully (Provider: ${provider}, Sender: ${user})`);
  return true;
};

// Validate config on module initialization
validateEmailConfig();

/**
 * Common HTML Wrapper Layout for Maruti Denim Emails
 */
const renderEmailLayout = ({ title, content }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const logoUrl = `${clientUrl}/Maruti%20denim%20logo.png`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { width: 100%; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background-color: #0f2a47; padding: 24px; text-align: center; border-bottom: 3px solid #1e293b; }
        .logo-container { margin-bottom: 12px; }
        .logo-img { height: 50px; width: auto; max-width: 220px; display: inline-block; object-fit: contain; }
        .header h1 { color: #ffffff; margin: 6px 0 0 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        .header p { color: #94a3b8; margin: 4px 0 0 0; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
        .body { padding: 32px 24px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #0f2a47; letter-spacing: 8px; margin: 0; }
        .alert-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px; border-radius: 6px; font-size: 13px; color: #1e40af; margin: 20px 0; }
        .btn-primary { display: inline-block; background-color: #059669; color: #ffffff !important; padding: 14px 28px; font-size: 14px; font-weight: 700; border-radius: 8px; text-decoration: none; text-align: center; margin: 16px 0; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2); }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo-container">
            <img src="${logoUrl}" alt="Maruti Denim Logo" class="logo-img" />
          </div>
          <h1>MARUTI NANDAN DENIM PVT LTD</h1>
          <p>Gate Pass & Material Management ERP</p>
        </div>
        <div class="body">
          ${content}
        </div>
        <div class="footer">
          <p><strong>Maruti Nandan Denim Pvt. Ltd.</strong> — Corporate Security Portal</p>
          <p>This is an automated operational system email. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Dispatch Email via Pooled Transport with Retries & Timeout
 */
const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@marutidenim.com';

  if (!transporter) {
    console.error(`[EmailService] SMTP credentials not configured in .env.`);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`\n⚠️ [EmailService DEV MODE] Transporter missing. Logging email content to terminal for testing:`);
      console.warn(`===============================================================`);
      console.warn(`RECIPIENT : ${to}`);
      console.warn(`SUBJECT   : ${subject}`);
      console.warn(`PLAIN TEXT:\n${text}`);
      console.warn(`===============================================================\n`);
      return { success: true, isDevFallback: true };
    }
    return {
      success: false,
      error: "We couldn't send the verification email. Please try again.",
      isHardBounce: false
    };
  }

  const mailOptions = { from, to, subject, html, text };
  let lastError = null;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Live email dispatched successfully to ${maskEmail(to)} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastError = err;
      const isHardBounce = err.responseCode === 550 || err.code === 'EENVELOPE' || /invalid recipient|user unknown|does not exist/i.test(err.message);

      const sanitizedMessage = redactSensitive(err.message || 'SMTP Connection Error');
      console.error(`[EmailService] Attempt ${attempt}/${maxAttempts} failed for ${maskEmail(to)}: ${sanitizedMessage}`);

      if (isHardBounce) {
        return {
          success: false,
          error: "We couldn't deliver an email to this address — please check it's correct.",
          isHardBounce: true
        };
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  // Development fallback if live SMTP fails (e.g. invalid Google App Password)
  if (process.env.NODE_ENV !== 'production') {
    const sanitizedError = redactSensitive(lastError?.message || 'SMTP Authentication Error');
    console.warn(`\n⚠️ [EmailService DEV MODE] Live SMTP dispatch failed (${sanitizedError}).`);
    console.warn(`🔑 [DEV VERIFICATION CODE] Logging email to terminal so testing is unblocked:`);
    console.warn(`===============================================================`);
    console.warn(`RECIPIENT : ${to}`);
    console.warn(`SUBJECT   : ${subject}`);
    console.warn(`PLAIN TEXT:\n${text}`);
    console.warn(`===============================================================\n`);
    return { success: true, isDevFallback: true };
  }

  return {
    success: false,
    error: "We couldn't send the verification email. Please try again.",
    isHardBounce: false
  };
};

/**
 * 1. Send Email Verification OTP (Registration)
 */
const sendVerificationOtpEmail = async (toEmail, otpCode, name = 'Employee') => {
  const subject = `${otpCode} is your Maruti Denim Email Verification Code`;
  const text = `Hello ${name},\n\nYour 6-digit email verification code for Maruti Denim Gate Pass System is: ${otpCode}\n\nThis code expires in 10 minutes. If you did not initiate this registration request, please ignore this email.`;

  const content = `
    <h2 style="color: #0f2a47; margin-top: 0; font-size: 18px;">Email Verification Request</h2>
    <p style="font-size: 14px; line-height: 1.5; color: #334155;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #334155;">Thank you for registering for an account on the <strong>Maruti Denim Gate Pass Management System</strong>. Please use the verification code below to verify your email address and continue setup:</p>

    <div class="otp-box">
      <p style="font-size: 12px; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0; font-weight: 600;">Verification Code</p>
      <div class="otp-code">${otpCode}</div>
    </div>

    <div class="alert-box">
      ⏰ <strong>Notice:</strong> This verification code will expire in <strong>10 minutes</strong>. Never share this code with anyone.
    </div>

    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">If you did not initiate this registration request, you can safely ignore this email.</p>
  `;

  return await sendMail({ to: toEmail, subject, html: renderEmailLayout({ title: subject, content }), text });
};

/**
 * 2. Send Password Reset OTP
 */
const sendPasswordResetOtpEmail = async (toEmail, otpCode) => {
  const subject = `${otpCode} is your Maruti Denim Password Reset Code`;
  const text = `Your 6-digit password reset code for Maruti Denim System is: ${otpCode}\n\nThis code expires in 10 minutes. If you did not request a password reset, please contact your administrator immediately.`;

  const content = `
    <h2 style="color: #0f2a47; margin-top: 0; font-size: 18px;">Password Reset Verification</h2>
    <p style="font-size: 14px; line-height: 1.5; color: #334155;">A password reset request was initiated for your Maruti Denim account associated with <strong>${toEmail}</strong>.</p>
    <p style="font-size: 14px; line-height: 1.5; color: #334155;">Please enter the single-use OTP code below to verify your identity and set a new password:</p>

    <div class="otp-box" style="background: #fff1f2; border-color: #fca5a5;">
      <p style="font-size: 12px; text-transform: uppercase; color: #991b1b; margin: 0 0 6px 0; font-weight: 600;">Password Reset Code</p>
      <div class="otp-code" style="color: #991b1b;">${otpCode}</div>
    </div>

    <div class="alert-box" style="background: #fff7ed; border-left-color: #f97316; color: #9a3412;">
      🔒 <strong>Security Warning:</strong> This code expires in <strong>10 minutes</strong>. If you did not request a password reset, someone else may be trying to access your account. Please notify your IT administrator.
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html: renderEmailLayout({ title: subject, content }), text });
};

/**
 * 3. Send Registration Pending Admin Approval Email
 */
const sendRegistrationPendingEmail = async (toEmail, name) => {
  const subject = `Registration Received — Pending Admin Approval | Maruti Denim System`;
  const text = `Hello ${name},\n\nYour email address has been verified successfully. Your account is now awaiting Admin approval before login access is enabled.`;

  const content = `
    <h2 style="color: #0f2a47; margin-top: 0; font-size: 18px;">Registration Received</h2>
    <p style="font-size: 14px; line-height: 1.5; color: #334155;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #334155;">Your email address has been verified successfully, and your account password has been created.</p>

    <div class="alert-box" style="background: #fefce8; border-left-color: #eab308; color: #854d0e;">
      ⏳ <strong>Status: Pending Admin Approval</strong><br>
      An Administrator has been notified to review and activate your account. You will receive an email notification once your access is approved.
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html: renderEmailLayout({ title: subject, content }), text });
};

/**
 * 4. Send Account Approved Notification Email
 */
const sendAccountApprovedEmail = async (toEmail, name) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginUrl = `${clientUrl}/login`;
  const subject = `🎉 Account Approved — Access Granted | Maruti Denim System`;
  const text = `Hello ${name},\n\nGreat news! Your account has been approved by the Administrator. You can now log in to the Maruti Denim Gate Pass & Material Management System at: ${loginUrl}`;

  const content = `
    <h2 style="color: #059669; margin-top: 0; font-size: 20px; font-weight: 700;">Account Approved & Access Granted!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">Great news! Your registration request for the <strong>Maruti Denim Gate Pass Management System</strong> has been reviewed and official access has been approved by the Administrator.</p>

    <div class="alert-box" style="background: #ecfdf5; border-left-color: #10b981; color: #065f46; margin: 24px 0; padding: 16px;">
      ✅ <strong>Account Status: Active & Approved</strong><br>
      You can now sign in using your registered email address (<strong>${toEmail}</strong>) and password to access your role-based dashboard.
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${loginUrl}" class="btn-primary">Sign In to Dashboard &rarr;</a>
    </div>

    <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">If you have any questions or require additional role permissions, please contact system administration.</p>
  `;

  return await sendMail({ to: toEmail, subject, html: renderEmailLayout({ title: subject, content }), text });
};

/**
 * 5. Send Password Changed Security Alert Email
 */
const sendPasswordChangedAlertEmail = async (toEmail, name = 'User') => {
  const subject = `Security Alert: Your Password Was Changed | Maruti Denim`;
  const text = `Hello ${name},\n\nYour password for Maruti Denim System was changed successfully. If you did not perform this action, contact your administrator immediately.`;

  const content = `
    <h2 style="color: #0f2a47; margin-top: 0; font-size: 18px;">Security Alert: Password Changed</h2>
    <p style="font-size: 14px; line-height: 1.5; color: #334155;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #334155;">This is an automated notification confirming that the password for your Maruti Denim account (<strong>${toEmail}</strong>) was changed successfully.</p>

    <div class="alert-box" style="background: #fef2f2; border-left-color: #ef4444; color: #991b1b;">
      ⚠️ <strong>Didn't change your password?</strong><br>
      If you did not initiate this change, please contact system administration immediately to secure your account.
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html: renderEmailLayout({ title: subject, content }), text });
};

module.exports = {
  validateEmailConfig,
  sendVerificationOtpEmail,
  sendPasswordResetOtpEmail,
  sendRegistrationPendingEmail,
  sendAccountApprovedEmail,
  sendPasswordChangedAlertEmail
};
