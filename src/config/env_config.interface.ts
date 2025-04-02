/**
 * Environment configuration interface
 */
export interface IEnvironmentConfig {
  // Server Configuration
  PORT: number;
  NODE_ENV: string;

  // Database Configuration
  DATABASE_HOST: string;
  DATABASE_PORT: number;

  // Security Configuration
  JWT_SECRET: string;

  // Logging Configuration
  LOG_REQUEST: boolean;
  LOG_ERROR: boolean;
}
