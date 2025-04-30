import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { hash } from 'bcrypt';
import { sendMail } from '@/lib/mail/send-mail';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Token and password are required' } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExp: {
          gt: new Date() // token is not expired
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid or expired token' } },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update user with new password and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationToken: null,
        verificationTokenExp: null
      }
    });

    // Send confirmation email
    if (user.email) {
      sendMail({
        to: user.email,
        subject: 'Your Password Has Been Reset - Party Vendors',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #6B46C1; padding: 20px; text-align: center; color: white;">
              <h1>Party Vendors</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2>Password Reset Successful</h2>
              <p>Hello ${user.name || 'there'},</p>
              <p>Your password has been successfully reset. You can now log in with your new password.</p>
              <p>If you did not request this change, please contact us immediately.</p>
              <p>Best regards,<br>The Party Vendors Team</p>
            </div>
            <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} Party Vendors. All rights reserved.</p>
            </div>
          </div>
        `
      }).catch(error => {
        console.error('Error sending confirmation email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'An error occurred while resetting your password' } 
      },
      { status: 500 }
    );
  }
} 