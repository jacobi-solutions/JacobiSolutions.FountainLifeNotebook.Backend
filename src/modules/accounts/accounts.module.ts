import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountRegistrationInterceptor } from './account-registration.interceptor';
import { AccountsController } from './accounts.controller';
import { Account, AccountSchema } from './schemas/account.schema';
import { AccountsRepository } from './accounts.repository';
import { AccountsService } from './accounts.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
  ],
  controllers: [AccountsController],
  providers: [
    AccountsRepository,
    AccountsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AccountRegistrationInterceptor,
    },
  ],
  exports: [AccountsService],
})
export class AccountsModule {}
