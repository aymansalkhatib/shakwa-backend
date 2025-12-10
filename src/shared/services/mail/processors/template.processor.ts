import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ITemplateProcessor } from '../interfaces/template-processor.interface';
import { TemplateData } from '../interfaces/template-data.type';

/**
 * Service for processing email templates
 * Handles loading templates from file system and rendering them with data
 */
@Injectable()
export class TemplateProcessor implements ITemplateProcessor {
  private readonly templateCache: Map<string, string> = new Map();
  private readonly templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
  }

  /**
   * Render a template with provided data
   * Replaces {{ variable }} placeholders with actual values
   */
  async renderTemplate(templateName: string, data: TemplateData): Promise<string> {
    const template = await this.loadTemplate(templateName);

    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const value = (data as Record<string, unknown>)[key];
      if (value === undefined || value === null) {
        throw new BadRequestException(`Missing template value for key: ${key}`);
      }
      return String(value);
    });
  }

  /**
   * Load template from file system with caching
   */
  async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${templateName}.html`);
    const cached = this.templateCache.get(templatePath);

    if (cached) {
      return cached;
    }

    try {
      const template = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(templatePath, template);
      return template;
    } catch (err) {
      throw new InternalServerErrorException(`Email template "${templateName}" not found`);
    }
  }

  /**
   * Clear all cached templates
   */
  clearCache(): void {
    this.templateCache.clear();
  }
}
