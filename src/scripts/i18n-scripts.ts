import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Console formatting utilities
export const box = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  middleLeft: '╠',
  middleRight: '╣',
  middleHorizontal: '═',
};

export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

/**
 * Strip ANSI escape codes so length calculations ignore them.
 * Regex from: QuickRef.ME :contentReference[oaicite:0]{index=0}
 */
function stripAnsi(str: string): string {
  return str.replace(
    /[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );
}

export class ConsoleFormatter {
  static createBox(title: string, content: string[]): string {
    // Compute the inner width by stripping ANSI codes
    const strippedTitle = stripAnsi(title);
    const strippedContent = content.map(stripAnsi);

    const width =
      Math.max(
        strippedTitle.length,
        ...strippedContent.map((line) => line.length),
        50,
      ) + 4;

    const top = box.topLeft + box.horizontal.repeat(width - 2);
    const titleLine =
      `${box.vertical} ${title}` + ' '.repeat(width - 2 - strippedTitle.length - 1);

    const separator = box.middleLeft + box.middleHorizontal.repeat(width - 2);

    const contentLines = content.map((line, idx) => {
      const len = strippedContent[idx].length;
      return `${box.vertical} ${line}` + ' '.repeat(width - 2 - len - 1);
    });

    const bottom = box.bottomLeft + box.horizontal.repeat(width - 2);

    return [top, titleLine, separator, ...contentLines, bottom].join('\n');
  }

  static createProgressBar(percentage: number, width = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const color =
      percentage >= 90
        ? colors.green
        : percentage >= 70
          ? colors.yellow
          : colors.red;
    // Use a block character and lighter block for empty
    return (
      color +
      '[' +
      '█'.repeat(filled) +
      '░'.repeat(empty) +
      `] ${percentage.toFixed(1)}%` +
      colors.reset
    );
  }

  static formatStatus(type: 'success' | 'warning' | 'error', msg: string): string {
    const icons = { success: '✅', warning: '⚠️', error: '❌' };
    const cols = {
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
    };
    return `${icons[type]} ${cols[type]}${msg}${colors.reset}`;
  }
}

interface TranslationStats {
  totalKeys: number;
  missingKeys: string[];
  extraKeys: string[];
  emptyValues: string[];
  duplicateValues: string[];
  identicalAcrossLangs: string[];
  coverage: number;
}

interface LanguageStats {
  [language: string]: TranslationStats;
}

interface TranslationValue {
  key: string;
  value: string;
  file: string;
  parameters: Set<string>;
}

class I18nValidator {
  private readonly basePath: string;
  private allKeys: Set<string> = new Set();
  private languageStats: LanguageStats = {};
  private translationValues: Map<string, Map<string, TranslationValue>> = new Map();
  private availableLanguages: string[] = [];
  private referenceLanguage: string;
  private keyParameters: Map<string, Set<string>> = new Map();

  constructor(
    basePath: string = join(process.cwd(), 'src/shared/i18n/translate'),
    referenceLanguage: string = 'en',
  ) {
    this.basePath = basePath;
    this.referenceLanguage = referenceLanguage;
    this.initializeLanguages();
  }

  private initializeLanguages(): void {
    try {
      this.availableLanguages = readdirSync(this.basePath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      if (!this.availableLanguages.includes(this.referenceLanguage)) {
        throw new Error(`Reference language '${this.referenceLanguage}' not found`);
      }
    } catch (error) {
      console.error(
        ConsoleFormatter.formatStatus('error', 'Error reading languages directory:'),
        error,
      );
      this.availableLanguages = [];
    }
  }

  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    const items = readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else if (item.isFile() && item.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private extractParameters(value: string): Set<string> {
    const parameters = new Set<string>();
    const matches = value.match(/\{([^}]+)\}/g);
    if (matches) {
      matches.forEach((match) => {
        parameters.add(match.slice(1, -1).trim());
      });
    }
    return parameters;
  }

  private extractKeysAndValues(
    obj: any,
    prefix = '',
    file: string,
  ): Map<string, TranslationValue> {
    const entries = new Map<string, TranslationValue>();
    const fileName = file.split('\\').pop()?.replace('.json', '') || '';

    const traverse = (current: any, currentPrefix: string) => {
      for (const [key, value] of Object.entries(current)) {
        const newKey = currentPrefix ? `${currentPrefix}.${key}` : key;
        const prefixedKey = `${fileName}.${newKey}`;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          traverse(value, newKey);
        } else {
          this.allKeys.add(prefixedKey);
          const parameters = this.extractParameters(String(value));
          entries.set(prefixedKey, {
            key: prefixedKey,
            value: String(value),
            file,
            parameters,
          });

          if (!this.keyParameters.has(prefixedKey)) {
            this.keyParameters.set(prefixedKey, new Set());
          }
          parameters.forEach((param) => {
            this.keyParameters.get(prefixedKey)?.add(param);
          });
        }
      }
    };

    traverse(obj, prefix);
    return entries;
  }

  private loadLanguageData(language: string): Map<string, TranslationValue> {
    const langPath = join(this.basePath, language);
    const files = this.getAllFiles(langPath);
    const allEntries = new Map<string, TranslationValue>();

    for (const file of files) {
      try {
        const content = JSON.parse(readFileSync(file, 'utf-8'));
        const entries = this.extractKeysAndValues(content, '', file);
        entries.forEach((value, key) => allEntries.set(key, value));
      } catch (error) {
        console.error(
          ConsoleFormatter.formatStatus('error', `Error processing file ${file}:`),
          error,
        );
      }
    }

    return allEntries;
  }

  private findIdenticalTranslations(): string[] {
    const identicalKeys: string[] = [];
    const allKeys = [...this.allKeys];

    for (const key of allKeys) {
      const values = new Set();
      let isIdentical = true;

      for (const lang of this.availableLanguages) {
        const translation = this.translationValues.get(lang)?.get(key)?.value;
        if (!translation) {
          isIdentical = false;
          break;
        }
        values.add(translation);
      }

      if (isIdentical && values.size === 1) {
        identicalKeys.push(key);
      }
    }

    return identicalKeys;
  }

  private findDuplicateValues(language: string): string[] {
    const valueMap = new Map<string, string[]>();
    const translations = this.translationValues.get(language);

    if (!translations) return [];

    translations.forEach((translation, key) => {
      const value = translation.value;
      if (!valueMap.has(value)) {
        valueMap.set(value, []);
      }
      valueMap.get(value)?.push(key);
    });

    return Array.from(valueMap.entries())
      .filter(([_, keys]) => keys.length > 1)
      .map(([value, keys]) => `${value} (${keys.join(', ')})`);
  }

  private generateStatistics(): void {
    this.translationValues.set(
      this.referenceLanguage,
      this.loadLanguageData(this.referenceLanguage),
    );

    for (const lang of this.availableLanguages) {
      if (lang !== this.referenceLanguage) {
        this.translationValues.set(lang, this.loadLanguageData(lang));
      }
    }

    const referenceKeys = [
      ...(this.translationValues.get(this.referenceLanguage)?.keys() ?? []),
    ];

    for (const lang of this.availableLanguages) {
      const langTranslations = this.translationValues.get(lang);
      if (!langTranslations) continue;

      const stats: TranslationStats = {
        totalKeys: langTranslations.size,
        missingKeys: [],
        extraKeys: [],
        emptyValues: [],
        duplicateValues: [],
        identicalAcrossLangs: [],
        coverage: 0,
      };

      stats.missingKeys = referenceKeys.filter((key) => !langTranslations.has(key));
      stats.extraKeys = [...langTranslations.keys()].filter(
        (key) => !referenceKeys.includes(key),
      );

      langTranslations.forEach((translation, key) => {
        if (!translation.value.trim()) {
          stats.emptyValues.push(key);
        }
      });

      const validKeys = langTranslations.size - stats.emptyValues.length;
      stats.coverage = (validKeys / referenceKeys.length) * 100;
      stats.coverage = Math.min(100, Math.max(0, stats.coverage));

      stats.duplicateValues = this.findDuplicateValues(lang);

      this.languageStats[lang] = stats;
    }

    const identicalKeys = this.findIdenticalTranslations();
    for (const lang of this.availableLanguages) {
      if (this.languageStats[lang]) {
        this.languageStats[lang].identicalAcrossLangs = identicalKeys;
      }
    }
  }

  private generateTypeScriptTypes(): string {
    let output = '// Generated by i18n-validator\n\n';

    // Generate interfaces for parameters
    const parameterInterfaces = [...this.keyParameters.entries()]
      .filter(([_, params]) => params.size > 0)
      .map(([key, params]) => {
        const interfaceName = this.generateInterfaceName(key);
        const parameters = [...params]
          .map((param) => `${this.normalizeValidationArgs(param)}: string`)
          .join('; ');
        return `interface ${interfaceName} {\n  ${parameters}\n}`;
      })
      .join('\n\n');

    output += parameterInterfaces + '\n\n';

    // Generate TranslationKeys constant
    output += 'const TranslationKeys = {\n';
    output += [...this.allKeys]
      .sort()
      .map((key) => `  '${key}': '${key}'`)
      .join(',\n');
    output += '\n} as const;\n\n';

    // Generate TranslationKey type
    output += 'export type TranslationKey = keyof typeof TranslationKeys;\n\n';

    // // Generate union type
    // output += '// Union type alternative\n';
    // output += `export type TranslationKeyUnion = ${[...this.allKeys]
    //   .sort()
    //   .map((key) => `'${key}'`)
    //   .join(' | ')};\n\n`;

    // Generate parameter types and interfaces
    output += '// Type definitions for interpolation parameters\n';
    output += 'type NoParams = undefined;\n\n';
    output += '// Placeholder type for type-safe interpolation\n';
    output += 'export interface TranslationInterpolations {\n';
    output += [...this.allKeys]
      .sort()
      .map((key) => {
        const params = this.keyParameters.get(key);
        if (params && params.size > 0) {
          return `  '${key}': ${this.generateInterfaceName(key)};`;
        }
        return `  '${key}': NoParams;`;
      })
      .join('\n');
    output += '\n}\n';

    return output;
  }

  private generateInterfaceName(key: string): string {
    return (
      key
        .split('.')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
        .replace(/[^a-zA-Z0-9]/g, '') + 'Params'
    );
  }

  public validate(): void {
    console.log(`\n${colors.bold}📊 Translation Validation Report${colors.reset}\n`);
    this.generateStatistics();

    this.printLanguageStats(this.referenceLanguage);

    for (const lang of this.availableLanguages) {
      if (lang !== this.referenceLanguage) {
        this.printLanguageStats(lang);
      }
    }

    const overallStatus = this.availableLanguages.every(
      (lang) => this.languageStats[lang]?.coverage === 100,
    );

    console.log(
      ConsoleFormatter.createBox('📈 Overall Status', [
        ConsoleFormatter.formatStatus(
          overallStatus ? 'success' : 'warning',
          overallStatus
            ? 'All translations complete!'
            : 'Some translations need attention',
        ),
      ]),
    );
  }

  private printLanguageStats(lang: string): void {
    const stats = this.languageStats[lang];
    if (!stats) return;

    const content = [
      ConsoleFormatter.formatStatus(
        stats.coverage >= 90
          ? 'success'
          : stats.coverage >= 70
            ? 'warning'
            : 'error',
        `Coverage: ${ConsoleFormatter.createProgressBar(stats.coverage)}`,
      ),
      '',
      ConsoleFormatter.formatStatus(
        stats.missingKeys.length === 0 ? 'success' : 'error',
        `Missing Keys: ${stats.missingKeys.length}`,
      ),
      ConsoleFormatter.formatStatus(
        stats.extraKeys.length === 0 ? 'success' : 'warning',
        `Extra Keys: ${stats.extraKeys.length}`,
      ),
      ConsoleFormatter.formatStatus(
        stats.emptyValues.length === 0 ? 'success' : 'error',
        `Empty Values: ${stats.emptyValues.length}`,
      ),
      ConsoleFormatter.formatStatus(
        stats.duplicateValues.length === 0 ? 'success' : 'warning',
        `Duplicate Values: ${stats.duplicateValues.length}`,
      ),
    ];

    console.log(
      ConsoleFormatter.createBox(
        `🌐 Language: ${lang}${lang === this.referenceLanguage ? ' (reference)' : ''}`,
        content,
      ),
    );

    if (stats.missingKeys.length > 0) {
      console.log(
        ConsoleFormatter.createBox(
          '❌ Missing Keys',
          stats.missingKeys.map((key) => `${colors.red}${key}${colors.reset}`),
        ),
      );
    }

    if (stats.extraKeys.length > 0) {
      console.log(
        ConsoleFormatter.createBox(
          '⚠️ Extra Keys',
          stats.extraKeys.map((key) => `${colors.yellow}${key}${colors.reset}`),
        ),
      );
    }

    if (stats.emptyValues.length > 0) {
      console.log(
        ConsoleFormatter.createBox(
          '❌ Empty Values',
          stats.emptyValues.map((key) => `${colors.red}${key}${colors.reset}`),
        ),
      );
    }

    console.log('');
  }

  public generateTypes(): void {
    const typesContent = this.generateTypeScriptTypes();
    const outputPath = join(process.cwd(), 'src', 'types', 'translation-keys.ts');
    writeFileSync(outputPath, typesContent, 'utf-8');

    console.log(
      ConsoleFormatter.createBox('📝 Type Generation', [
        ConsoleFormatter.formatStatus(
          'success',
          `Types generated at: ${outputPath}`,
        ),
      ]),
    );
  }

  private normalizeValidationArgs(key: string): string {
    return key.replace(/\.(\d+)/g, '_$1'); // Replace .0, .1 etc. with _0, _1
  }
}

// Validate translations and generate types
const validator = new I18nValidator();
validator.validate();
validator.generateTypes();
