import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { StaffModule } from './modules/staff/staff.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
