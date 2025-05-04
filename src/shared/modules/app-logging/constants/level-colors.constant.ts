import { Colors } from './colors.constant';

/**
 * Mapping of log levels to their corresponding colors
 */
export const LevelColors = {
  info: Colors.fgBlue,
  INFO: Colors.fgBrightBlue,
  error: Colors.fgError,
  ERROR: Colors.fgError,
  warn: Colors.bgBrightYellow + Colors.fgBlack,
  WARN: Colors.bgBrightYellow + Colors.fgBlack,
  debug: Colors.bgBrightBlue + Colors.fgWhite,
  DEBUG: Colors.bgBrightBlue + Colors.fgWhite,
  verbose: Colors.bgBrightMagenta + Colors.fgWhite,
  VERBOSE: Colors.bgBrightMagenta + Colors.fgWhite,
};
