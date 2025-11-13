import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { sendMail } from '@/lib/mail/send-mail';

export async function POST(
  request: Request,
  { params }: { params: { providerId: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { providerId } = params;

    // Find the provider with user data
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: true
      }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'Provider not found' } },
        { status: 404 }
      );
    }

    // Update provider to verified
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        isVerified: true
      }
    });

    // Update user email verification
    await prisma.user.update({
      where: { id: provider.userId },
      data: {
        emailVerified: new Date()
      }
    });

    // Send approval email to provider
    const appName = process.env.APP_NAME || 'Party Vendors';
    const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/provider/dashboard/payments`;
    
    const emailHtml = generateProviderApprovalEmailHtml(
      provider.user.name,
      provider.businessName || 'Your Company',
      dashboardUrl
    );

    const emailSent = await sendMail({
      to: provider.user.email,
      subject: `Congratulations! Your ${appName} Provider Application Has Been Approved`,
      html: emailHtml
    });

    if (!emailSent) {
      console.error(`Failed to send approval email to ${provider.user.email}`);
    }

    // Create notification for provider
    await prisma.notification.create({
      data: {
        userId: provider.userId,
        type: 'SYSTEM',
        title: 'Provider Application Approved',
        content: 'Congratulations! Your provider application has been approved. You can now access your provider dashboard and start listing services.',
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Provider approved successfully'
    });

  } catch (error) {
    console.error('Error approving provider:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function generateProviderApprovalEmailHtml(contactPerson: string, companyName: string, dashboardUrl: string): string {
  const appName = process.env.APP_NAME || 'Party Vendors';
  const primaryColor = '#ED8936';
  const buttonBgColor = '#ED8936';
  const buttonTextColor = 'white';
  const accentColor = '#FEEBC8';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">${appName}</h1>
      </div>
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; background-color: #ffffff;">
        <h2 style="color: #2D3748; margin-top: 0;">🎉 Congratulations! Your Application Has Been Approved!</h2>
        <p style="color: #4A5568;">Hello ${contactPerson},</p>
        <p style="color: #4A5568;">We're excited to inform you that your provider application for <strong>${companyName}</strong> has been approved!</p>
        
        <div style="background-color: ${accentColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2D3748; margin-top: 0; font-size: 18px;">🚀 Get Started Now</h3>
          <p style="color: #4A5568; margin-bottom: 15px;">You now have full access to your provider dashboard. Here's what you can do:</p>
          <ul style="color: #4A5568; padding-left: 20px; margin: 10px 0;">
            <li style="margin-bottom: 10px;">Create and manage your service listings</li>
            <li style="margin-bottom: 10px;">Set up your PayPal account to receive payments</li>
            <li style="margin-bottom: 10px;">View and respond to client requests</li>
            <li style="margin-bottom: 10px;">Manage your bookings and calendar</li>
            <li style="margin-bottom: 10px;">Track your earnings and transactions</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: ${buttonBgColor}; color: ${buttonTextColor}; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 16px;">
            Access Your Dashboard
          </a>
        </div>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #4A5568; margin: 0; font-size: 14px;"><strong>💡 Quick Tip:</strong> Connect your PayPal account first to start accepting payments from clients.</p>
        </div>
        
        <p style="color: #4A5568;">If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>
        
        <p style="color: #4A5568;">We're thrilled to have you as part of our community and look forward to your success on our platform!</p>
        
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

