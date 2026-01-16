"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const event_emitter_1 = require("@nestjs/event-emitter");
let PaymentsController = PaymentsController_1 = class PaymentsController {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(PaymentsController_1.name);
        this.db = admin.firestore();
    }
    async edahabCallback(body) {
        this.logger.log(`Edahab Callback: ${JSON.stringify(body)}`);
        // Edahab structure: { InvoiceId: '...', StatusCode: '0', TransactionId: '...' }
        // We match InvoiceId to TransactionId or OrderId based on how we sent it.
        // EDahabProvider uses transactionId directly usually. 
        // In initiate: transactionId: data.InvoiceId
        const invoiceId = body.InvoiceId;
        const statusCode = body.StatusCode; // 0 = Success? Need docs. Assuming 0 or 200.
        if (!invoiceId)
            return { status: 'ignored' };
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
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
            // Log Event
            this.eventEmitter.emit('ORDER_PAID', {
                userId: orderData.customerId,
                metadata: { orderId: orderDoc.id, method: 'EDAHAB' }
            });
        }
        else {
            await orderDoc.ref.update({
                paymentStatus: 'FAILED',
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
        }
        return { status: 'received' };
    }
    async waafiCallback(body) {
        this.logger.log(`Waafi Callback: ${JSON.stringify(body)}`);
        // Implementation similar to Edahab, depends on Waafi payload
        return { status: 'received' };
    }
};
__decorate([
    (0, common_1.Post)('callback/edahab'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "edahabCallback", null);
__decorate([
    (0, common_1.Post)('callback/waafi'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "waafiCallback", null);
PaymentsController = PaymentsController_1 = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], PaymentsController);
exports.PaymentsController = PaymentsController;
//# sourceMappingURL=payments.controller.js.map