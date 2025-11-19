import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INTERNAL_USERS_REPOSITORY_TOKEN } from './constants/internal-users.tokens';
import { InternalUsersController } from './controllers/internal-users.controller';
import { InternalUserEntity } from './entities/internal-user.entity';
import { InternalUsersRepository } from './repositories/internal-users.repository';
import { InternalUsersService } from './services/internal-users.service';

@Module({
  imports: [TypeOrmModule.forFeature([InternalUserEntity])],
  controllers: [InternalUsersController],
  providers: [
    InternalUsersService,
    {
      provide: INTERNAL_USERS_REPOSITORY_TOKEN,
      useClass: InternalUsersRepository,
    },
  ],
  exports: [InternalUsersService, INTERNAL_USERS_REPOSITORY_TOKEN],
})
export class InternalUsersModule {}
