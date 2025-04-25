// import { Controller, Get } from '@nestjs/common';
// import { AppConfigService } from './app_config.service';

// @Controller('config')
// export class AppConfigController {
//   constructor(private readonly configService: AppConfigService) {}

//   /**
//    * Get Server Configuration
//    */
//   @Get('server')
//   getServerConfig() {
//     return this.configService.server;
//   }

//   /**
//    * Get Database Configuration
//    */
//   @Get('database')
//   getDatabaseConfig() {
//     return this.configService.database;
//   }

//   /**
//    * Get Security Configuration
//    */
//   @Get('security')
//   getSecurityConfig() {
//     return this.configService.security;
//   }

//   /**
//    * Get Logging Configuration
//    */
//   @Get('logging')
//   getLoggingConfig() {
//     return this.configService.logging;
//   }
// }
