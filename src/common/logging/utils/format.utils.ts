import { Colors } from '../constants/colors.constant';

/**
 * Utility class for formatting log output
 */
export class FormatUtils {
  /**
   * Applies ANSI color codes to text if color output is enabled
   */
  static colorize(text: any, color: string, showColor: boolean): string {
    if (!showColor) return text;
    return `${color}${text}${Colors.reset}`;
  }

  /**
   * Formats HTTP status codes with appropriate colors
   */
  static formatStatusCode(statusCode: number, showColor: boolean): string {
    const getStatusColor = (code: number): string => {
      if (code < 400) return Colors.fgBrightGreen;
      if (code < 500) return Colors.fgBrightYellow;
      return Colors.fgBrightRed;
    };
    return this.colorize(
      statusCode?.toString(),
      getStatusColor(statusCode),
      showColor,
    );
  }

  /**
   * Creates a formatted box around content with a title
   */
  static drawBox(
    title: string,
    content: string,
    color: string,
    showColor: boolean,
  ): string {
    const contentLines = content.split('\n');
    const formattedContent = contentLines
      .map(
        (line) =>
          `${this.colorize('║', color, showColor)} ${this.colorize(line, Colors.fgBrightWhite, showColor)}`,
      )
      .join('\n');

    return `${this.colorize('╠═' + '═'.repeat(100), color, showColor)}
${this.colorize('║', color, showColor)} ${this.colorize(title.toUpperCase(), Colors.fgBrightYellow, showColor)}
${this.colorize('╠═' + '═'.repeat(6), color, showColor)}
${formattedContent}
${this.colorize('╠═' + '═'.repeat(100), color, showColor)}`;
  }

  /**
   * Formats JSON data with proper indentation
   */
  static formatJson(value: any): string {
    try {
      // If value is a string, try to parse it as JSON
      const jsonData = typeof value === 'string' ? JSON.parse(value) : value;

      // Format the JSON with proper indentation and add left border
      return JSON.stringify(jsonData, null, 2)
        .split('\n')
        .map((line) => line.trimEnd()) // Remove trailing spaces
        .join('\n');
    } catch {
      // If parsing fails, return the original value
      return String(value);
    }
  }

  /**
   * Formats metadata objects for logging
   */
  static formatMetadata(meta: any, color: string, showColor: boolean): string {
    const formatValue = (key: string, value: any): string => {
      // Handle special cases
      if (key === 'statusCode' && typeof value === 'number') {
        return this.formatStatusCode(value, showColor);
      }

      if (key === 'responseTime') {
        return value.toString();
      }

      // Format as JSON for body and query
      if (key === 'body' || key === 'query' || 'params' || 'params') {
        return this.formatJson(value);
      }

      return this.formatJson(value);
    };

    return Object.entries(meta)
      .map(([key, value]) => {
        const formattedValue = formatValue(key, value);

        // Special box formatting for body and query
        if (key === 'body' || key === 'query' || 'params' || 'params') {
          return this.drawBox(key, formattedValue, color, showColor);
        }

        // Regular key-value formatting for other fields
        return `${this.colorize(key, Colors.fgBrightMagenta, showColor)}: ${
          key === 'responseTime'
            ? this.colorize(formattedValue, Colors.fgBrightCyan, showColor)
            : this.colorize(formattedValue, Colors.fgBrightWhite, showColor)
        }`;
      })
      .join('\n');
  }
}
