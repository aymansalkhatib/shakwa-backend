/**
 * Environment configuration constants
 */
export const ENV_FILES = {
  DEFAULT: '.env',
  DEVELOPMENT: '.env.development',
  PRODUCTION: '.env.production',
  TEST: '.env.test',
  
  getEnvFile: (env: string) => {
    const envFile = `.env.${env}`;
    // Check if the environment name exists in the keys of ENV_FILES
    if (
      !Object.values(ENV_FILES).includes(envFile) &&
      envFile !== ENV_FILES.DEFAULT
    ) {
      return null; // Return null if the environment file doesn't exist
    }
    return envFile;
  },
};


export const ENV_VALIDATION = {
  MIN_JWT_LENGTH: 16,
  BOOLEAN_TRUTHY: ['true', '1', 'yes'] as const,
  BOOLEAN_FALSY: ['false', '0', 'no'] as const,
} as const;

export type BooleanTruthyValues = (typeof ENV_VALIDATION.BOOLEAN_TRUTHY)[number];
export type BooleanFalsyValues = (typeof ENV_VALIDATION.BOOLEAN_FALSY)[number];
