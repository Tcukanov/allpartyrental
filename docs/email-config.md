# Email Configuration Guide

This guide explains how to set up and configure email functionality for the Party Vendors application.

## Environment Variables for Email

The application uses the following environment variables for email configuration:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `SMTP_HOST` | SMTP server hostname | `smtp.example.com` |
| `SMTP_PORT` | SMTP server port | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | SMTP username/account | `your-email@example.com` |
| `SMTP_PASS` | SMTP password | `your-password` |
| `SMTP_SECURE` | Whether to use SSL (true/false) | `true` for port 465, `false` for others |
| `EMAIL_FROM` | Default sender email address | `noreply@example.com` |
| `APP_NAME` | Application name used in email templates | `Party Vendors` |

These variables should be added to your `.env` file in the project root.

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

## Production Configuration

For production, you need to set up a real SMTP server. You can use services like:

- [GoDaddy](https://www.godaddy.com) (current default)
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

## Debugging Email Issues

If you're experiencing issues with email sending:

1. Check the server logs - the application logs detailed information about email attempts
2. Verify your SMTP credentials are correct
3. Try different port/secure settings if your provider requires it
4. Ensure your sending domain has proper SPF/DKIM records (for production)

For more detailed debugging, you can set `NODE_ENV=development` temporarily in production to use Ethereal and verify email content.

## Email Templates

The application currently includes templates for:

- Account verification emails
- Password reset emails

These templates are defined in `src/lib/mail/send-mail.ts` and use environment variables like `APP_NAME` to customize the content.

If you need to modify these templates, update the respective functions in the `send-mail.ts` file. 