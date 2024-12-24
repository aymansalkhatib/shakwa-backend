import { Module } from '@nestjs/common';
import { ConfigExampleService } from './config-example.service';
import { ConfigExampleController } from './config-example.controller';

@Module({
  controllers: [ConfigExampleController],
  providers: [ConfigExampleService],
})
export class ConfigExampleModule {}
