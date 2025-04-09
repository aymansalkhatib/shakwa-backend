import { Colors } from '../constants/colors.constant';
import { LevelColors } from '../constants/level-colors.constant';
import { LogMetadata } from '../interfaces/logger.interface';
import { FormatUtils } from '../utils/format.utils';

/**
 * Formats log entries for console output with optional color support
 */
export class ConsoleFormatter {
  static format(entry: LogMetadata, showColor: boolean): string {
    const {
      levelLog,
      context,
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
      error = 'No Error',
      traceId,
      requestTime,
      responseTime,
      during,
    } = entry;

    const levelColor = LevelColors[levelLog] || Colors.fgBrightWhite;
    const border = '═'.repeat(100);

    return `${FormatUtils.colorize('\n╔═' + border, Colors.fgBrightBlue, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('LEVEL:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(levelLog, levelColor, showColor)} 
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('METHOD:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(method, Colors.fgBrightWhite, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('MESSAGE:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(message, Colors.fgBrightWhite, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('CONTEXT:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(context || 'Global', Colors.fgBrightWhite, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('REQUESTTIME:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(requestTime, Colors.fgBrightGreen, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('RESPONSETIME:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(responseTime, Colors.fgBrightGreen, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('DURING:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(during, Colors.fgBrightGreen, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('USER ID:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(userId, Colors.fgBrightCyan, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('IP ADDRESS:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(ip, Colors.fgBrightCyan, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('CONTENT LENGTH:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(contentLength, Colors.fgBrightCyan, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('USER AGENT:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(userAgent, Colors.fgBrightCyan, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('URL:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(url, Colors.fgBrightWhite, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('TRACEID:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(traceId, Colors.fgBrightWhite, showColor)}
${FormatUtils.formatMetadata({ headers }, Colors.fgBrightGreen, showColor)}
${FormatUtils.formatMetadata({ params }, Colors.fgBrightCyan, showColor)}
${FormatUtils.formatMetadata({ query }, Colors.fgBrightYellow, showColor)}
${FormatUtils.formatMetadata({ body }, Colors.fgBrightRed, showColor)}
${FormatUtils.formatMetadata({ error }, Colors.fgBrightRed, showColor)}
${FormatUtils.colorize('║', Colors.fgBrightBlue, showColor)} ${FormatUtils.colorize('STATUS CODE:', Colors.fgBrightYellow, showColor)} ${FormatUtils.colorize(FormatUtils.formatStatusCode(statusCode, showColor), Colors.fgBrightGreen, showColor)}
${FormatUtils.colorize('╚═' + border + '\n', Colors.fgBrightBlue, showColor)}`;
  }
}
