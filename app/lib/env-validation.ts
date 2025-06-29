// Environment variable validation
const requiredEnvVars = [
  'REPO_PATH',
  'OBSIDIAN_ROOT_DIR',
] as const;

// Optional env vars for future use
// const optionalEnvVars = [
//   'NEXT_PUBLIC_API_URL',
//   'API_URL', 
//   'NODE_ENV',
// ] as const;

export function validateEnvironment(): void {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    // During build time, just warn instead of throwing
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
      return;
    }
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file and ensure these variables are set.`
    );
  }

  // Validate REPO_PATH exists
  const repoPath = process.env.REPO_PATH;
  if (repoPath) {
    // Dynamic import to avoid ESLint error
    import('fs').then(fs => {
      if (!fs.existsSync(repoPath)) {
        console.warn(`Warning: REPO_PATH directory does not exist: ${repoPath}`);
      }
    }).catch(() => {
      console.warn('Could not validate REPO_PATH existence');
    });
  }

  const rootDir = process.env.OBSIDIAN_ROOT_DIR || 'Root';
  if (repoPath) {
    // Dynamic import to avoid ESLint error
    import('path').then(path => {
      const fullRootPath = path.join(repoPath, rootDir);
      import('fs').then(fs => {
        if (!fs.existsSync(fullRootPath)) {
          console.warn(`Warning: OBSIDIAN_ROOT_DIR does not exist: ${fullRootPath}`);
        }
      }).catch(() => {
        console.warn('Could not validate OBSIDIAN_ROOT_DIR existence');
      });
    }).catch(() => {
      console.warn('Could not import path module');
    });
  }

  // Log environment status in development
  if (process.env.NODE_ENV === 'development') {
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
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Only run on server-side in non-production environments
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    // Don't exit process during build, just warn
    console.warn('Continuing with build process...');
  }
}