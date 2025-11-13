import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { sendMail } from '@/lib/mail/send-mail';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ providerId: string }> }
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

    const { providerId } = await params;

    // Find the provider with user data
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: true,
        cities: true
      }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'Provider not found' } },
        { status: 404 }
      );
    }

    // Delete provider cities
    await prisma.providerCity.deleteMany({
      where: { providerId: provider.id }
    });

    // Delete provider record
    await prisma.provider.delete({
      where: { id: providerId }
    });

    // Delete user account
    await prisma.user.delete({
      where: { id: provider.userId }
    });

    // Send rejection email to provider
    const appName = process.env.APP_NAME || 'Party Vendors';
    
    const emailHtml = generateProviderRejectionEmailHtml(
      provider.user.name,
      provider.businessName || 'Your Company'
    );

    const emailSent = await sendMail({
      to: provider.user.email,
      subject: `Update on Your ${appName} Provider Application`,
      html: emailHtml
    });

    if (!emailSent) {
      console.error(`Failed to send rejection email to ${provider.user.email}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Provider application rejected'
    });

  } catch (error) {
    console.error('Error rejecting provider:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function generateProviderRejectionEmailHtml(contactPerson: string, companyName: string): string {
  const appName = process.env.APP_NAME || 'Party Vendors';
  const primaryColor = '#ED8936';
  const accentColor = '#FEEBC8';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">${appName}</h1>
      </div>
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; background-color: #ffffff;">
        <h2 style="color: #2D3748; margin-top: 0;">Update on Your Provider Application</h2>
        <p style="color: #4A5568;">Hello ${contactPerson},</p>
        <p style="color: #4A5568;">Thank you for your interest in becoming a service provider with ${appName}. After careful review of your application for <strong>${companyName}</strong>, we regret to inform you that we are unable to approve your application at this time.</p>
        
        <div style="background-color: ${accentColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2D3748; margin-top: 0; font-size: 16px;">Why This Might Have Happened</h3>
          <p style="color: #4A5568; margin: 0;">Our approval process considers several factors including business verification, service offerings, and platform requirements. At this time, your application did not meet all our current criteria.</p>
        </div>
        
        <p style="color: #4A5568;">If you believe this decision was made in error or if you'd like to reapply in the future, please contact our support team for more information.</p>
        
        <p style="color: #4A5568;">We appreciate your understanding and wish you the best in your business endeavors.</p>
        
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

