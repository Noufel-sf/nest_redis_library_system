export type EnvConfig = {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
};

export function validateEnv(config: EnvConfig): EnvConfig {
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  return config;
}
