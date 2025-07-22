#!/usr/bin/env node

/**
 * Docker Container Setup Integration Tests
 * Tests Docker configuration files and container setup without Docker runtime
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for test output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  describe(name, fn) {
    console.log(`\n${colors.blue}🧪 ${name}${colors.reset}`);
    fn();
  }

  test(name, fn) {
    try {
      fn();
      this.passed++;
      console.log(`  ${colors.green}✅ ${name}${colors.reset}`);
    } catch (error) {
      this.failed++;
      console.log(`  ${colors.red}❌ ${name}${colors.reset}`);
      console.log(`     ${colors.red}Error: ${error.message}${colors.reset}`);
    }
  }

  warn(message) {
    this.warnings++;
    console.log(`  ${colors.yellow}⚠️  Warning: ${message}${colors.reset}`);
  }

  expect(actual) {
    return {
      toBeTruthy: () => {
        if (!actual) throw new Error(`Expected truthy, got ${actual}`);
      },
      toBeFalsy: () => {
        if (actual) throw new Error(`Expected falsy, got ${actual}`);
      },
      toBe: (expected) => {
        if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
      },
      toContain: (substring) => {
        if (!actual.includes(substring)) {
          throw new Error(`Expected "${actual}" to contain "${substring}"`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) throw new Error(`Expected ${actual} > ${expected}`);
      }
    };
  }

  summary() {
    console.log(`\n${colors.cyan}📊 Test Summary${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.warnings}${colors.reset}`);
    
    const total = this.passed + this.failed;
    const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;
    console.log(`${colors.magenta}📈 Success Rate: ${successRate}%${colors.reset}\n`);
    
    return this.failed === 0;
  }
}

// Test utilities
function fileExists(filepath) {
  return fs.existsSync(filepath);
}

function readFile(filepath) {
  return fs.readFileSync(filepath, 'utf8');
}

function parseYaml(content) {
  // Simple YAML parser for basic validation (production would use yaml library)
  const lines = content.split('\n');
  const result = {};
  let currentKey = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    
    if (trimmed.includes(':') && !trimmed.startsWith(' ')) {
      const [key, value] = trimmed.split(':').map(s => s.trim());
      currentKey = key;
      if (value) result[key] = value;
      else result[key] = {};
    }
  }
  
  return result;
}

// Initialize test runner
const runner = new TestRunner();

// Test execution
console.log(`${colors.magenta}🐳 Docker Container Setup Integration Tests${colors.reset}`);

runner.describe('Docker Files Validation', () => {
  runner.test('Dockerfile exists and is valid', () => {
    runner.expect(fileExists('./Dockerfile')).toBeTruthy();
    const content = readFile('./Dockerfile');
    runner.expect(content).toContain('FROM node:18-alpine');
    runner.expect(content).toContain('WORKDIR /app');
    runner.expect(content).toContain('EXPOSE 33000');
  });

  runner.test('Dockerfile.dev exists for development', () => {
    runner.expect(fileExists('./Dockerfile.dev')).toBeTruthy();
    const content = readFile('./Dockerfile.dev');
    runner.expect(content).toContain('NODE_ENV=development');
    runner.expect(content).toContain('WATCHPACK_POLLING=true');
  });

  runner.test('docker-compose.yml is valid', () => {
    runner.expect(fileExists('./docker-compose.yml')).toBeTruthy();
    const content = readFile('./docker-compose.yml');
    runner.expect(content).toContain('version:');
    runner.expect(content).toContain('services:');
    runner.expect(content).toContain('doo-wiki:');
  });

  runner.test('.dockerignore optimizes build context', () => {
    runner.expect(fileExists('./.dockerignore')).toBeTruthy();
    const content = readFile('./.dockerignore');
    runner.expect(content).toContain('node_modules');
    runner.expect(content).toContain('.git');
    runner.expect(content).toContain('*.log');
  });
});

runner.describe('Security Configuration', () => {
  runner.test('Dockerfile uses non-root user', () => {
    const dockerfile = readFile('./Dockerfile');
    runner.expect(dockerfile).toContain('adduser');
    runner.expect(dockerfile).toContain('USER nextjs');
  });

  runner.test('Environment template excludes secrets from git', () => {
    runner.expect(fileExists('./.env.docker')).toBeTruthy();
    const dockerignore = readFile('./.dockerignore');
    runner.expect(dockerignore).toContain('.env');
  });

  runner.test('Docker Compose has resource limits', () => {
    const compose = readFile('./docker-compose.yml');
    runner.expect(compose).toContain('resources:');
    runner.expect(compose).toContain('limits:');
    runner.expect(compose).toContain('memory:');
  });
});

runner.describe('Application Configuration', () => {
  runner.test('Next.js configuration supports Docker', () => {
    runner.expect(fileExists('./next.config.mjs')).toBeTruthy();
    const config = readFile('./next.config.mjs');
    // Check if standalone output is configured in Dockerfile build process
    const dockerfile = readFile('./Dockerfile');
    runner.expect(dockerfile).toContain('standalone');
  });

  runner.test('Package.json has required scripts', () => {
    const pkg = JSON.parse(readFile('./package.json'));
    runner.expect(pkg.scripts.build).toBeTruthy();
    runner.expect(pkg.scripts.start).toBeTruthy();
    runner.expect(pkg.packageManager).toContain('pnpm');
  });

  runner.test('Port configuration is consistent', () => {
    const dockerfile = readFile('./Dockerfile');
    const compose = readFile('./docker-compose.yml');
    const pkg = JSON.parse(readFile('./package.json'));
    
    runner.expect(dockerfile).toContain('EXPOSE 33000');
    runner.expect(compose).toContain('33000:33000');
    runner.expect(pkg.scripts.dev).toContain('-p 33000');
  });
});

runner.describe('Development Workflow', () => {
  runner.test('Development override exists', () => {
    runner.expect(fileExists('./docker-compose.override.yml')).toBeTruthy();
    const override = readFile('./docker-compose.override.yml');
    runner.expect(override).toContain('NODE_ENV=development');
  });

  runner.test('Hot reload is configured', () => {
    const devDockerfile = readFile('./Dockerfile.dev');
    runner.expect(devDockerfile).toContain('WATCHPACK_POLLING=true');
  });
});

runner.describe('Service Dependencies', () => {
  runner.test('Redis service is configured', () => {
    const compose = readFile('./docker-compose.yml');
    runner.expect(compose).toContain('redis:');
    runner.expect(compose).toContain('redis:7-alpine');
  });

  runner.test('Redis configuration file exists', () => {
    runner.expect(fileExists('./config/redis.conf')).toBeTruthy();
    const redisConf = readFile('./config/redis.conf');
    runner.expect(redisConf).toContain('maxmemory');
  });

  runner.test('Health checks are configured', () => {
    const compose = readFile('./docker-compose.yml');
    runner.expect(compose).toContain('healthcheck:');
    
    const dockerfile = readFile('./Dockerfile');
    runner.expect(dockerfile).toContain('HEALTHCHECK');
  });
});

runner.describe('Production Readiness', () => {
  runner.test('Multi-stage build is optimized', () => {
    const dockerfile = readFile('./Dockerfile');
    const stages = dockerfile.match(/FROM .+ AS \w+/g);
    runner.expect(stages.length).toBeGreaterThan(2);
  });

  runner.test('Build context is optimized', () => {
    const dockerignore = readFile('./.dockerignore');
    const lines = dockerignore.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );
    runner.expect(lines.length).toBeGreaterThan(20);
  });

  runner.test('Environment documentation exists', () => {
    runner.expect(fileExists('./DOCKER_GUIDE.md')).toBeTruthy();
    const guide = readFile('./DOCKER_GUIDE.md');
    runner.expect(guide).toContain('Quick Start');
    runner.expect(guide).toContain('Production Deployment');
  });
});

// Check for potential improvements
runner.describe('Recommendations', () => {
  const compose = readFile('./docker-compose.yml');
  const dockerfile = readFile('./Dockerfile');

  if (!compose.includes('secrets:')) {
    runner.warn('Docker secrets not configured for sensitive data');
  }

  if (!dockerfile.includes('dumb-init')) {
    runner.warn('Consider using dumb-init for proper signal handling');
  }

  if (!fileExists('./.github/workflows/docker-deploy.yml')) {
    runner.warn('CI/CD pipeline not found for automated Docker builds');
  }

  if (!compose.includes('networks:')) {
    runner.warn('Custom Docker networks recommended for service isolation');
  }
});

// Run summary and exit
const success = runner.summary();
process.exit(success ? 0 : 1);