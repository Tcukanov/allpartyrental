import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { content } = body;

    // Validate input
    if (!content) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Message content is required' } },
        { status: 400 }
      );
    }

    // Get chat by ID
    const chat = await prisma.chat.findUnique({
      where: {
        id,
      },
      include: {
        offer: true,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Chat not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to send message in this chat
    const isClient = session.user.id === chat.offer.clientId;
    const isProvider = session.user.id === chat.offer.providerId;

    if (!isClient && !isProvider) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Determine sender and receiver
    const senderId = session.user.id as string;
    const receiverId = isClient ? chat.offer.providerId : chat.offer.clientId;

    // AI moderation (simplified version)
    let isFlagged = false;
    let flagReason = null;
    let moderatedContent = content;

    // Simple check for contact information (phone numbers, emails)
    const phoneRegex = /(\+\d{1,3})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Check if offer is not approved yet
    if (chat.offer.status !== 'APPROVED') {
      // Mask phone numbers and emails if found
      if (phoneRegex.test(content) || emailRegex.test(content)) {
        isFlagged = true;
        flagReason = 'Contact information detected';
        moderatedContent = content
          .replace(phoneRegex, '***PHONE***')
          .replace(emailRegex, '***EMAIL***');
      }
    }

    // Check for profanity (simplified)
    const profanityList = ['badword1', 'badword2', 'badword3'];
    const profanityRegex = new RegExp(`\\b(${profanityList.join('|')})\\b`, 'gi');
    
    if (profanityRegex.test(content)) {
      isFlagged = true;
      flagReason = 'Profanity detected';
      moderatedContent = content.replace(profanityRegex, '***');
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId: id,
        senderId,
        receiverId,
        content: moderatedContent,
        originalContent: isFlagged ? content : undefined,
        isFlagged,
        flagReason,
      },
    });

    // Update chat's updatedAt
    await prisma.chat.update({
      where: {
        id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: 'New Message',
        content: `You have received a new message regarding ${chat.offer.service.name}.`,
      },
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
