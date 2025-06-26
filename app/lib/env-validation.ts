// Environment variable validation
const requiredEnvVars = [
  'REPO_PATH',
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

  // Log environment status in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully');
    console.log(`📁 REPO_PATH: ${process.env.REPO_PATH}`);
    console.log(`🌐 API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'not set'}`);
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
if (typeof window === 'undefined') {
  // Only run on server-side
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}