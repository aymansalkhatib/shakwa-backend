export interface IMailData {
  to: string;
  subject: string;
  template?: string;
  context: Record<string, any>;
}
