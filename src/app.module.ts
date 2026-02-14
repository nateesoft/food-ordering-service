import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
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
    ServiceRequestsModule,
    MembersModule,
    DashboardModule,
    InventoryModule,
    StaffModule,
    PaymentsModule,
    ShiftsModule,
    PromotionsModule,
    WebhooksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
