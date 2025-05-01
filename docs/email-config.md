# Email Configuration Guide

This guide explains how to set up and configure email functionality for the Party Vendors application.

## Environment Variables for Email

The application uses the following environment variables for email configuration:

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `SMTP_HOST` | SMTP server hostname | `smtp.example.com` | ✓ |
| `SMTP_PORT` | SMTP server port | `465` (SSL) or `587` (TLS) | ✓ |
| `SMTP_USER` | SMTP username/account | `your-email@example.com` | ✓ |
| `SMTP_PASS` | SMTP password | `your-password` | ✓ |
| `SMTP_SECURE` | Whether to use SSL (true/false) | `true` for port 465, `false` for others | ✓ |
| `EMAIL_FROM` | Default sender email address | `noreply@example.com` | ✓ |
| `APP_NAME` | Application name used in email templates | `Party Vendors` | Optional |
| `FORCE_PRODUCTION_EMAIL` | Force real email sending in development | `true` or `false` (default: `false`) | Optional |

> **Important:** All required variables must be set in your `.env` file. There are no fallback values in the code.

## Email Branding and Design

The email templates use a brand-consistent design to maintain a professional appearance:

### Color Scheme

The current color scheme uses a warm peach palette that matches the website branding:

- **Primary Color:** `#ED8936` (Peach/Orange) 
  - Used for headers, buttons, and links
  - Represents the festive, celebratory nature of party services
  - Evokes feelings of warmth, energy, and fun

- **Accent Color:** `#FEEBC8` (Light Peach)
  - Used as background for highlighted sections like links
  - A lighter shade of the primary color

- **Text Colors:** Various shades of gray for readability
  - `#2D3748` (Dark Gray) - Headers
  - `#4A5568` (Medium Gray) - Body text
  - `#718096` (Light Gray) - Secondary text

### Customizing Brand Colors

To change the email color scheme:

1. Open `src/lib/mail/send-mail.ts`
2. Locate the color variables at the beginning of each template function:

```javascript
const primaryColor = '#ED8936'; // Peach color - brand primary
const buttonBgColor = '#ED8936';
const buttonTextColor = 'white';
const accentColor = '#FEEBC8'; // Light peach background - brand accent
```

3. Replace these colors with your desired brand colors

## Development Environment (Test Emails)

In development mode, the application uses [Ethereal Email](https://ethereal.email) for testing, which allows you to send emails without actually delivering them to real recipients. This is perfect for development and testing.

When the application starts in development mode (`NODE_ENV=development`), it automatically:

1. Creates a temporary Ethereal Email account
2. Logs the account details to the console
3. Provides preview URLs for sent emails

You'll see output like this in your console when the app starts:

```
Created Ethereal test account
Login URL: https://ethereal.email/login
Username: example@ethereal.email
Password: examplePassword
```

You can use these credentials to log in to Ethereal and view all the test emails sent by your app.

### Sending Real Emails in Development

If you need to test with real email delivery in development mode, you can set:

```
FORCE_PRODUCTION_EMAIL=true
```

This will use your production SMTP settings even in development mode. This is useful for:

- Testing email delivery to real inboxes
- Troubleshooting email formatting on actual email clients
- Testing spam filters and deliverability

Be careful with this setting as it will send real emails to any address you specify in your code.

## Production Configuration

For production, you need to set up a real SMTP server. You can use services like:

- [GoDaddy](https://www.godaddy.com)
- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- Your own SMTP server

Example for GoDaddy:

```
SMTP_HOST="smtpout.secureserver.net"
SMTP_PORT=465
SMTP_USER="your-email@yourdomain.com"
SMTP_PASS="your-password"
SMTP_SECURE=true
EMAIL_FROM="your-email@yourdomain.com"
```

Example for SendGrid:

```
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_SECURE=false
EMAIL_FROM="your-verified-sender@yourdomain.com"
```

## Troubleshooting Email Issues

If you're experiencing issues with email sending:

### Common SMTP Authentication Errors

If you see error messages like `535 Authentication Failed`, check the following:

1. Verify your SMTP credentials (username/password) are correct
2. Make sure your email service hasn't implemented additional security features like:
   - Two-factor authentication (you may need an app-specific password)
   - IP restrictions (your server IP might be blocked)
   - Rate limiting (too many attempts)

### Other Troubleshooting Steps

1. Check the server logs - the application logs detailed information about email attempts
2. Try different port/secure settings if your provider requires it
3. Ensure your sending domain has proper SPF/DKIM records (for production)
4. Test with a different email provider (like SendGrid) to isolate the issue

For more detailed debugging, you can check:

- Use `FORCE_PRODUCTION_EMAIL=false` to see if Ethereal emails work (indicates a problem with your SMTP settings)
- Monitor your email service's dashboard for bounces or failed deliveries
- Check recipient spam folders
- Verify your email domain has proper DNS records for email authentication

## Email Templates

The application currently includes templates for:

- Account verification emails
- Password reset emails

These templates are defined in `src/lib/mail/send-mail.ts` and use environment variables like `APP_NAME` to customize the content.

If you need to modify these templates, update the respective functions in the `send-mail.ts` file. 