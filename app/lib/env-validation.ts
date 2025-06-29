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
  // Skip validation completely during build phases
  if (process.env.NEXT_PHASE || process.env.NODE_ENV === 'production') {
    console.log('⏭️ Skipping environment validation during build/production');
    return;
  }

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work correctly.');
    return; // Don't throw, just warn
  }

  // Log environment status in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully');
    console.log(`📁 REPO_PATH: ${process.env.REPO_PATH || 'not set'}`);
    console.log(`📂 OBSIDIAN_ROOT_DIR: ${process.env.OBSIDIAN_ROOT_DIR || 'not set'}`);
    console.log(`🌐 OBSIDIAN_URL: ${process.env.OBSIDIAN_URL || 'not set'}`);
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
if (typeof window === 'undefined' && 
    !process.env.NEXT_PHASE && 
    process.env.NODE_ENV !== 'production') {
  // Only run on server-side during development runtime (not during build)
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    // Never exit process, just warn
    console.warn('Continuing execution...');
  }
}