import { colorize, Colors } from './colors.helper';
import { formatMetadata, formatStatusCode } from './format.utils';
import { LogMetadata } from '../logger.types';

const levelColors = {
  info: Colors.fgBlue,
  INFO: Colors.fgBrightBlue,
  error: Colors.bgBrightRed + Colors.fgWhite,
  ERROR: Colors.bgBrightRed + Colors.fgWhite,
  warn: Colors.bgBrightYellow + Colors.fgBlack,
  WARN: Colors.bgBrightYellow + Colors.fgBlack,
  debug: Colors.bgBrightBlue + Colors.fgWhite,
  DEBUG: Colors.bgBrightBlue + Colors.fgWhite,
  verbose: Colors.bgBrightMagenta + Colors.fgWhite,
  VERBOSE: Colors.bgBrightMagenta + Colors.fgWhite,
};

export function formatConsoleOutput(entry: LogMetadata, showColor: boolean): string {
  const {
    time,
    level_,
    context,
    responseTime,
    userId,
    ip,
    query,
    contentLength,
    statusCode,
    userAgent,
    url,
    method,
    body,
    message,
    headers,
    params,
    error,
  } = entry;

  const levelColor = levelColors[level_] || Colors.fgBrightWhite;
  const border = '═'.repeat(100);

  return `${colorize('\n╔═' + border, Colors.fgBrightBlue, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('LEVEL:', Colors.fgBrightYellow, showColor)} ${colorize(level_, levelColor, showColor)} 
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('METHOD:', Colors.fgBrightYellow, showColor)} ${colorize(method, Colors.fgBrightWhite, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('MESSAGE:', Colors.fgBrightYellow, showColor)} ${colorize(message, Colors.fgBrightWhite, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('CONTEXT:', Colors.fgBrightYellow, showColor)} ${colorize(context || 'Global', Colors.fgBrightWhite, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('TIME:', Colors.fgBrightYellow, showColor)} ${colorize(time, Colors.fgBrightGreen, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('RESPONSE TIME:', Colors.fgBrightYellow, showColor)} ${colorize(responseTime, Colors.fgBrightGreen, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('USER ID:', Colors.fgBrightYellow, showColor)} ${colorize(userId, Colors.fgBrightCyan, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('IP ADDRESS:', Colors.fgBrightYellow, showColor)} ${colorize(ip, Colors.fgBrightCyan, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('CONTENT LENGTH:', Colors.fgBrightYellow, showColor)} ${colorize(contentLength, Colors.fgBrightCyan, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('USER AGENT:', Colors.fgBrightYellow, showColor)} ${colorize(userAgent, Colors.fgBrightCyan, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('URL:', Colors.fgBrightYellow, showColor)} ${colorize(url, Colors.fgBrightWhite, showColor)}
${formatMetadata({ headers }, Colors.fgBrightGreen, showColor)}
${formatMetadata({ params }, Colors.fgBrightCyan, showColor)}
${formatMetadata({ query }, Colors.fgBrightYellow, showColor)}
${formatMetadata({ body }, Colors.fgBrightRed, showColor)}
${formatMetadata({ error }, Colors.fgBrightRed, showColor)}
${colorize('║', Colors.fgBrightBlue, showColor)} ${colorize('STATUS CODE:', Colors.fgBrightYellow, showColor)} ${colorize(formatStatusCode(statusCode, showColor), Colors.fgBrightGreen, showColor)}
${colorize('╚═' + border + '\n', Colors.fgBrightBlue, showColor)}`;
}
