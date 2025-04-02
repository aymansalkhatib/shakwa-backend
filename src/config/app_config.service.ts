// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import type { EnvironmentConfig } from './env.schema';

// @Injectable()
// export class AppConfigService {
//   constructor(private readonly configService: ConfigService<EnvironmentConfig>) {}

//   /**
//    * Server configuration
//    */
//   get server() {
//     return {
//       port: this.configService.get('PORT'),
//       environment: this.configService.get('NODE_ENV'),
//     };
//   }

//   /**
//    * Database configuration
//    */
//   get database() {
//     return {
//       host: this.configService.get('DATABASE_HOST'),
//       port: this.configService.get('DATABASE_PORT'),
//     };
//   }

//   /**
//    * Security configuration
//    */
//   get security() {
//     return {
//       jwtSecret: this.configService.get('JWT_SECRET'),
//     };
//   }

//   /**
//    * Logging configuration
//    */
//   get logging() {
//     return {
//       request: this.configService.get('LOG_REQUEST'),
//       error: this.configService.get('LOG_ERROR'),
//     };
//   }
// }
