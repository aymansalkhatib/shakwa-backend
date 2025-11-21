// Module
export * from './mail.module';

// Main Service
export * from './mail.service';

// Interfaces
export * from './interfaces/mail-provider.interface';
export * from './interfaces/template-processor.interface';
export * from './interfaces/send-verification-code.interface';
export * from './interfaces/send-login-locked-options';

// Providers (for direct injection if needed)
export * from './providers/resend/resend-mail.provider';
export * from './providers/sendgrid/sendgrid-mail.provider';

// Processors (for direct injection if needed)
export * from './processors/template.processor';
