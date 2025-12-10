import { TemplateData } from './template-data.type';

/**
 * Interface for template processing service
 * Handles loading and rendering email templates
 */
export interface ITemplateProcessor {
  /**
   * Render a template with provided data
   * @param templateName Name of the template to render
   * @param data Data to inject into the template
   * @returns Rendered HTML string
   */
  renderTemplate(templateName: string, data: TemplateData): Promise<string>;

  /**
   * Load a template from file system
   * @param templateName Name of the template to load
   * @returns Template content as string
   */
  loadTemplate(templateName: string): Promise<string>;

  /**
   * Clear template cache
   */
  clearCache(): void;
}

export const TEMPLATE_PROCESSOR = Symbol('TEMPLATE_PROCESSOR');
