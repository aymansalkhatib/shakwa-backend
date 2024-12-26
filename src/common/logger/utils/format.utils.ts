import { colorize, Colors } from './colors.helper';

export function formatStatusCode(statusCode: number, showColor: boolean): string {
  const getStatusColor = (code: number): string => {
    if (code < 400) return Colors.fgBrightGreen;
    if (code < 500) return Colors.fgBrightYellow;
    return Colors.fgBrightRed;
  };
  return colorize(statusCode?.toString(), getStatusColor(statusCode), showColor);
}

export function drawBox(
  title: string,
  content: string,
  color: any,
  showColor: boolean,
): string {
  const contentLines = content.split('\n');
  const formattedContent = contentLines
    .map(
      (line) =>
        `${colorize('║', color, showColor)} ${colorize(line, Colors.fgBrightWhite, showColor)}`,
    )
    .join('\n');

  return `${colorize('╠═' + '═'.repeat(100), color, showColor)}
${colorize('║', color, showColor)} ${colorize(title.toUpperCase(), Colors.fgBrightYellow, showColor)}
${colorize('╠═' + '═'.repeat(6), color, showColor)}
${formattedContent}
${colorize('╠═' + '═'.repeat(100), color, showColor)}`;
}

export function formatJson(value: any): string {
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

export function formatMetadata(meta: any, color: any, showColor: boolean): string {
  const formatValue = (key: string, value: any): string => {
    // Handle special cases
    if (key === 'statusCode' && typeof value === 'number') {
      return formatStatusCode(value, showColor);
    }

    if (key === 'responseTime') {
      return value.toString();
    }

    // Format as JSON for body and query
    if (key === 'body' || key === 'query' || 'params' || 'params') {
      return formatJson(value);
    }

    return formatJson(value);
  };

  return Object.entries(meta)
    .map(([key, value]) => {
      const formattedValue = formatValue(key, value);

      // Special box formatting for body and query
      if (key === 'body' || key === 'query' || 'params' || 'params') {
        return drawBox(key, formattedValue, color, showColor);
      }

      // Regular key-value formatting for other fields
      return `${colorize(key, Colors.fgBrightMagenta, showColor)}: ${
        key === 'responseTime'
          ? colorize(formattedValue, Colors.fgBrightCyan, showColor)
          : colorize(formattedValue, Colors.fgBrightWhite, showColor)
      }`;
    })
    .join('\n');
}
