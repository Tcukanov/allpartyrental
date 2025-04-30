import nodemailer from 'nodemailer';

// Declare transporter at module level but initialize based on environment
let transporter: nodemailer.Transporter;
let isEthereal = false;

// Initialize the transporter based on environment
async function initializeTransporter() {
  // Use ethereal email for development
  if (process.env.NODE_ENV === 'development') {
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
  }
  
  // Verify transporter configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('SMTP connection error:', error);
    } else {
      console.log("SMTP server is ready to send messages");
    }
  });
}

// Function to create the production transporter with GoDaddy settings
function createProductionTransporter() {
  // Create a transporter using GoDaddy SMTP settings
  transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: 'info@party-vendors.com',
      pass: 'Qazzaq33$',
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });
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
      await initializeTransporter();
    }
    
    // Set default from address if not provided
    const fromAddress = from || '"Party Vendors" <info@party-vendors.com>';
    
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
      
      // In development, we'll return this URL so it can be included in responses
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate a verification email HTML content
 */
export function generateVerificationEmailHtml(username: string, verificationLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6B46C1; padding: 20px; text-align: center; color: white;">
        <h1>Party Vendors</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${username || 'there'},</p>
        <p>Thank you for signing up with Party Vendors! To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #6B46C1; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3182CE;">${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The Party Vendors Team</p>
      </div>
      <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Party Vendors. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Generate a password reset email HTML content
 */
export function generatePasswordResetEmailHtml(username: string, resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6B46C1; padding: 20px; text-align: center; color: white;">
        <h1>Party Vendors</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Reset Your Password</h2>
        <p>Hello ${username || 'there'},</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #6B46C1; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3182CE;">${resetLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Party Vendors Team</p>
      </div>
      <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Party Vendors. All rights reserved.</p>
      </div>
    </div>
  `;
} 