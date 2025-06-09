import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/payment/payment-service'
import {PayPalClientFixed} from '../../../../lib/payment/paypal-client'

export async function POST(request) {
    const requestBody = await request.json();
    console.log('📝 Request body received:', requestBody);

    const { orderID, serviceId, bookingDate, hours, addons = [] } = requestBody;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        console.log('❌ No session found');
        return NextResponse.json({
            error: 'Authentication required. Please log in to continue.',
            code: 'UNAUTHORIZED'
        }, { status: 401 });
    }

    const paypalClient = new PayPalClientFixed();
    const order = await paypalClient.getOrder(orderID);
    console.log('AUTH ORDER', order);
    const paymentService = new PaymentService()
    const auth = await paymentService.saveAuthorization({
        serviceId,
        userId: session.user.id,
        bookingDate,
        hours,
        addons
    }, order)

    return NextResponse.json(auth)

}
