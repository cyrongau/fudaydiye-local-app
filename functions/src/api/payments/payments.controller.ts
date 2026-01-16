
import { Controller, Post, Body, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);
    private db = admin.firestore();

    constructor(private eventEmitter: EventEmitter2) { }

    @Post('callback/edahab')
    async edahabCallback(@Body() body: any) {
        this.logger.log(`Edahab Callback: ${JSON.stringify(body)}`);

        // Edahab structure: { InvoiceId: '...', StatusCode: '0', TransactionId: '...' }
        // We match InvoiceId to TransactionId or OrderId based on how we sent it.
        // EDahabProvider uses transactionId directly usually. 
        // In initiate: transactionId: data.InvoiceId

        const invoiceId = body.InvoiceId;
        const statusCode = body.StatusCode; // 0 = Success? Need docs. Assuming 0 or 200.

        if (!invoiceId) return { status: 'ignored' };

        // Find Order with this payment reference
        // We stored stored `paymentGatewayRef: result.transactionId` which is InvoiceId.
        const ordersSnap = await this.db.collection('orders')
            .where('paymentGatewayRef', '==', invoiceId)
            .limit(1)
            .get();

        if (ordersSnap.empty) {
            this.logger.warn(`Order not found for Edahab Invoice ${invoiceId}`);
            return { status: 'not_found' };
        }

        const orderDoc = ordersSnap.docs[0];
        const orderData = orderDoc.data();

        if (statusCode === '0') { // Check Edahab docs for exact success code
            await orderDoc.ref.update({
                status: 'CONFIRMED',
                paymentStatus: 'COMPLETED',
                isPaid: true,
                updatedAt: FieldValue.serverTimestamp()
            });

            // Log Event
            this.eventEmitter.emit('ORDER_PAID', {
                userId: orderData.customerId,
                metadata: { orderId: orderDoc.id, method: 'EDAHAB' }
            });
        } else {
            await orderDoc.ref.update({
                paymentStatus: 'FAILED',
                updatedAt: FieldValue.serverTimestamp()
            });
        }

        return { status: 'received' };
    }

    @Post('callback/waafi')
    async waafiCallback(@Body() body: any) {
        this.logger.log(`Waafi Callback: ${JSON.stringify(body)}`);
        // Implementation similar to Edahab, depends on Waafi payload
        return { status: 'received' };
    }
}
