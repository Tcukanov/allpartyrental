import nodemailer from 'nodemailer';

// Declare transporter at module level but initialize based on environment
let transporter: nodemailer.Transporter;
let isEthereal = false;

// Flag to force production mode for email sending
const FORCE_PRODUCTION_EMAIL = process.env.FORCE_PRODUCTION_EMAIL === 'true';

// Initialize the transporter based on environment
async function initializeTransporter() {
  // Use ethereal email for development, unless forcing production mode
  if (process.env.NODE_ENV === 'development' && !FORCE_PRODUCTION_EMAIL) {
    try {
      // Generate ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      isEthereal = true;
      
      console.log('Created Ethereal test account');
      console.log('Login URL: https://ethereal.email/login');
      console.log('Username:', testAccount.user);
      console.log('Password:', testAccount.pass);
      
      // Create ethereal test transporter
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        debug: true,
        logger: true
      });
      
      console.log('Using Ethereal email for development');
    } catch (error) {
      console.error('Failed to create Ethereal test account, falling back to production settings', error);
      createProductionTransporter();
    }
  } else {
    // Use production settings
    createProductionTransporter();
    if (FORCE_PRODUCTION_EMAIL) {
      console.log('FORCE_PRODUCTION_EMAIL=true: Using production email settings in development mode');
    }
  }
  
  // Verify transporter configuration if it was successfully created
  if (transporter) {
    transporter.verify(function(error, success) {
      if (error) {
        console.error('SMTP connection error:', error);
      } else {
        console.log("SMTP server is ready to send messages");
      }
    });
  }
}

// Function to create the production transporter with SMTP settings from environment variables
function createProductionTransporter() {
  // Check if required environment variables are set
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  
  if (!smtpHost || !smtpUser || !smtpPass || !smtpPort) {
    console.error('SMTP configuration missing. Check your environment variables:');
    console.error('- SMTP_HOST:', smtpHost ? '✓' : '✗ Missing');
    console.error('- SMTP_PORT:', smtpPort ? '✓' : '✗ Missing');
    console.error('- SMTP_USER:', smtpUser ? '✓' : '✗ Missing');
    console.error('- SMTP_PASS:', smtpPass ? '✓' : '✗ Missing (or empty)');
    console.error('Email functionality will not work until these are properly configured.');
    return;
  }
  
  // Create a transporter using SMTP settings from environment variables
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // use SSL if set to true
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
      // Add more permissive TLS options for better compatibility
      minVersion: 'TLSv1',
      ciphers: 'HIGH:MEDIUM:!aNULL:!MD5:!RC4'
    }
  });
  
  console.log(`Using SMTP server: ${smtpHost}:${smtpPort}`);
}

// Initialize transporter when module is loaded
initializeTransporter().catch(console.error);

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

/**
 * Send an email using the configured SMTP transport
 */
export async function sendMail({ to, subject, html, from }: EmailOptions): Promise<boolean> {
  try {
    // Make sure transporter is initialized
    if (!transporter) {
      console.error('No email transporter is configured. Email will not be sent.');
      if (process.env.NODE_ENV === 'development') {
        console.log('Email that would have been sent:');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${html.substring(0, 100)}...`);
      }
      return false;
    }
    
    // Set default from address if not provided
    // Use from email from environment variable if available
    const defaultFromEmail = process.env.EMAIL_FROM;
    if (!defaultFromEmail) {
      console.warn('EMAIL_FROM environment variable is not set. Using fallback sender.');
    }
    
    const fromAddress = from || (defaultFromEmail ? `"${process.env.APP_NAME || 'Party Vendors'}" <${defaultFromEmail}>` : undefined);
    
    console.log(`Attempting to send email to: ${to} with subject: ${subject}`);
    
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    
    // For Ethereal emails, provide a preview URL
    if (isEthereal) {
      const previewURL = nodemailer.getTestMessageUrl(info);
      console.log(`Preview URL: ${previewURL}`);
      
      // If we're in development mode with FORCE_PRODUCTION_EMAIL off, 
      // add debug information to verify the email was sent correctly
      if (process.env.NODE_ENV === 'development' && !FORCE_PRODUCTION_EMAIL) {
        console.log('------------------ EMAIL CONTENT ------------------');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('--------------------------------------------------');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Email Templates and Color Theme
 * 
 * Brand Colors:
 * - Primary Color: #ED8936 (Peach/Orange) - Used for headers, buttons, and links
 *   This warm, inviting peach color represents the festive and celebratory nature
 *   of party services. It evokes feelings of warmth, energy, and fun.
 * 
 * - Accent Color: #FEEBC8 (Light Peach) - Used for highlighted sections
 *   A lighter shade of the primary color, used as background for important information.
 * 
 * - Text Colors: Various shades of gray for readability and professionalism
 *   #2D3748 (Dark Gray) - Headers
 *   #4A5568 (Medium Gray) - Body text
 *   #718096 (Light Gray) - Secondary text
 */

/**
 * Generate a verification email HTML content
 */
export function generateVerificationEmailHtml(username: string, verificationLink: string): string {
  const appName = process.env.APP_NAME || 'Party Vendors';
  const primaryColor = '#ED8936'; // Peach color - brand primary
  const buttonBgColor = '#ED8936';
  const buttonTextColor = 'white';
  const accentColor = '#FEEBC8'; // Light peach background - brand accent
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">${appName}</h1>
      </div>
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; background-color: #ffffff;">
        <h2 style="color: #2D3748; margin-top: 0;">Verify Your Email Address</h2>
        <p style="color: #4A5568;">Hello ${username || 'there'},</p>
        <p style="color: #4A5568;">Thank you for signing up with ${appName}! To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: ${buttonBgColor}; color: ${buttonTextColor}; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #4A5568;">Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: ${primaryColor}; background-color: ${accentColor}; padding: 10px; border-radius: 4px; font-size: 14px;">${verificationLink}</p>
        <p style="color: #718096; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="color: #718096; font-size: 14px;">If you did not create an account, you can safely ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #4A5568; margin-bottom: 5px;">Best regards,</p>
          <p style="color: #4A5568; font-weight: bold; margin-top: 0;">The ${appName} Team</p>
        </div>
      </div>
      <div style="text-align: center; padding: 15px; background-color: #f7fafc; color: #718096; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Generate a password reset email HTML content
 */
export function generatePasswordResetEmailHtml(username: string, resetLink: string): string {
  const appName = process.env.APP_NAME || 'Party Vendors';
  const primaryColor = '#ED8936'; // Peach color - brand primary
  const buttonBgColor = '#ED8936';
  const buttonTextColor = 'white';
  const accentColor = '#FEEBC8'; // Light peach background - brand accent
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">${appName}</h1>
      </div>
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; background-color: #ffffff;">
        <h2 style="color: #2D3748; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #4A5568;">Hello ${username || 'there'},</p>
        <p style="color: #4A5568;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p style="color: #4A5568;">To reset your password, click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: ${buttonBgColor}; color: ${buttonTextColor}; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #4A5568;">Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: ${primaryColor}; background-color: ${accentColor}; padding: 10px; border-radius: 4px; font-size: 14px;">${resetLink}</p>
        <p style="color: #718096; font-size: 14px;">This link will expire in 24 hours.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #4A5568; margin-bottom: 5px;">Best regards,</p>
          <p style="color: #4A5568; font-weight: bold; margin-top: 0;">The ${appName} Team</p>
        </div>
      </div>
      <div style="text-align: center; padding: 15px; background-color: #f7fafc; color: #718096; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  `;
} 