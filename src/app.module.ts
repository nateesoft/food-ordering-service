import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './common/logger/logger.module';
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MenuModule } from './modules/menu/menu.module';
import { AddonsModule } from './modules/addons/addons.module';
import { OrdersModule } from './modules/orders/orders.module';
import { QueueModule } from './modules/queue/queue.module';
import { TablesModule } from './modules/tables/tables.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { MembersModule } from './modules/members/members.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StaffModule } from './modules/staff/staff.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BranchModule } from './modules/branch/branch.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuditModule } from './modules/audit/audit.module';
import { EventsModule } from './modules/events/events.module';
import { PaymentGatewayModule } from './modules/payment-gateway/payment-gateway.module';
import { TaxInvoiceModule } from './modules/tax-invoice/tax-invoice.module';
import { KDSModule } from './modules/kds/kds.module';
import { RabbitMQBrokerModule } from './modules/rabbitmq/rabbitmq.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    BranchModule,
    AuthModule,
    MenuModule,
    AddonsModule,
    OrdersModule,
    QueueModule,
    TablesModule,
    StaffModule,
    ServiceRequestsModule,
    MembersModule,
    DashboardModule,
    InventoryModule,
    StaffModule,
    PaymentsModule,
    ShiftsModule,
    PromotionsModule,
    WebhooksModule,
    UploadModule,
    AuditModule,
    EventsModule,
    PaymentGatewayModule,
    TaxInvoiceModule,
    KDSModule,
    RabbitMQBrokerModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*path');
  }
}
