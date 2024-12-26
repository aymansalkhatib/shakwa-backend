import { Controller, Get } from '@nestjs/common';
import { ConfigExampleService } from './config-example.service';

@Controller('config-example')
export class ConfigExampleController {
  constructor(private readonly configExampleService: ConfigExampleService) {}

  // Fetch a single configuration (e.g., 'PORT')
  @Get('one')
  fetchOneConfig() {
    throw Error('asas');
    return this.configExampleService.fetchOneConfigs();
  }
}
