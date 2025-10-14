import { logger } from "./logger";

/**
 * 환경 변수 검증 설정
 */
const ENV_CONFIG = {
  required: [
    'REPO_PATH',
    'OBSIDIAN_ROOT_DIR',
  ] as const,
  optional: [
    'OBSIDIAN_URL',
    'NEXT_PUBLIC_API_URL',
    'SERVER_DOMAIN',
  ] as const,
} as const;

/**
 * 환경 변수 검증
 */
export function validateEnvironment(): void {
  // Skip validation completely during build phases
  if (process.env.NEXT_PHASE || process.env.NODE_ENV === 'production') {
    logger.info('⏭️ Skipping environment validation during build/production');
    return;
  }

  const missing = ENV_CONFIG.required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    // During build time, just warn instead of throwing
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      logger.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
      return;
    }
    logger.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    logger.warn('Some features may not work correctly.');
    return; // Don't throw, just warn
  }

  // Validate REPO_PATH exists
  const repoPath = process.env.REPO_PATH;
  if (repoPath) {
    // Dynamic import to avoid ESLint error
    import('fs').then(fs => {
      if (!fs.existsSync(repoPath)) {
        logger.warn(`Warning: REPO_PATH directory does not exist: ${repoPath}`);
      }
    }).catch(() => {
      logger.warn('Could not validate REPO_PATH existence');
    });
  }

  const rootDir = process.env.OBSIDIAN_ROOT_DIR || 'Root';
  if (repoPath) {
    // Dynamic import to avoid ESLint error
    import('path').then(path => {
      const fullRootPath = path.join(repoPath, rootDir);
      import('fs').then(fs => {
        if (!fs.existsSync(fullRootPath)) {
          logger.warn(`Warning: OBSIDIAN_ROOT_DIR does not exist: ${fullRootPath}`);
        }
      }).catch(() => {
        logger.warn('Could not validate OBSIDIAN_ROOT_DIR existence');
      });
    }).catch(() => {
      logger.warn('Could not import path module');
    });
  }

  // Log environment status in development
  if (process.env.NODE_ENV === 'development') {
    logger.info('✅ Environment variables validated successfully');
    logger.info(`📁 REPO_PATH: ${process.env.REPO_PATH || 'not set'}`);
    logger.info(`📂 OBSIDIAN_ROOT_DIR: ${process.env.OBSIDIAN_ROOT_DIR || 'not set'}`);
    logger.info(`🌐 OBSIDIAN_URL: ${process.env.OBSIDIAN_URL || 'not set'}`);
    logger.info(`🌐 API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'not set'}`);
  }
}

export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

// Validate environment on module load
if (typeof window === 'undefined' &&
    !process.env.NEXT_PHASE &&
    process.env.NODE_ENV !== 'production') {
  // Only run on server-side during development runtime (not during build)
  try {
    validateEnvironment();
  } catch (error) {
    logger.error('❌ Environment validation failed:', error);
    // Never exit process, just warn
    logger.warn('Continuing execution...');
  }
}