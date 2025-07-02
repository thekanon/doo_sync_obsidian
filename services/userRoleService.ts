import { readFileSync } from 'fs';
import { join } from 'path';
import { UserRole } from '../app/types/user';

interface UserRoleConfig {
  admins: string[];
  verifiedUsers: string[];
  blockedUsers: string[];
  settings: {
    autoVerifyEmailDomains: string[];
    maxAnonymousVisits: number;
    defaultRole: string;
  };
}

class UserRoleService {
  private static instance: UserRoleService;
  private config: UserRoleConfig | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = process.env.USER_ROLES_FILE || 'config/user-roles.json';
  }

  public static getInstance(): UserRoleService {
    if (!UserRoleService.instance) {
      UserRoleService.instance = new UserRoleService();
    }
    return UserRoleService.instance;
  }

  private loadConfig(): UserRoleConfig {
    if (this.config) {
      return this.config;
    }

    try {
      const configFilePath = join(process.cwd(), this.configPath);
      const configData = readFileSync(configFilePath, 'utf-8');
      this.config = JSON.parse(configData);
      return this.config!;
    } catch (error) {
      console.error('Failed to load user roles config:', error);
      // Fallback to environment variables for backward compatibility
      return this.getFallbackConfig();
    }
  }

  private getFallbackConfig(): UserRoleConfig {
    return {
      admins: process.env.NEXT_PUBLIC_ADMIN_EMAIL ? [process.env.NEXT_PUBLIC_ADMIN_EMAIL] : [],
      verifiedUsers: [],
      blockedUsers: [],
      settings: {
        autoVerifyEmailDomains: [],
        maxAnonymousVisits: 10,
        defaultRole: 'GUEST'
      }
    };
  }

  public refreshConfig(): void {
    this.config = null;
    this.loadConfig();
  }

  public getUserRole(email: string | null, isEmailVerified: boolean = false): UserRole {
    const config = this.loadConfig();

    if (!email) {
      return UserRole.ANONYMOUS;
    }

    // Check if user is blocked
    if (config.blockedUsers.includes(email)) {
      return UserRole.ANONYMOUS;
    }

    // Check if user is admin
    if (config.admins.includes(email)) {
      return UserRole.ADMIN;
    }

    // Check if user is explicitly verified
    if (config.verifiedUsers.includes(email)) {
      return UserRole.VERIFIED;
    }

    // Auto-verify based on email domain
    const emailDomain = '@' + email.split('@')[1];
    if (config.settings.autoVerifyEmailDomains.includes(emailDomain)) {
      return UserRole.VERIFIED;
    }

    // Check email verification status
    if (isEmailVerified) {
      return UserRole.VERIFIED;
    }

    return UserRole.GUEST;
  }

  public isAdmin(email: string | null): boolean {
    if (!email) return false;
    const config = this.loadConfig();
    return config.admins.includes(email);
  }

  public isVerified(email: string | null, isEmailVerified: boolean = false): boolean {
    const role = this.getUserRole(email, isEmailVerified);
    return role === UserRole.ADMIN || role === UserRole.VERIFIED;
  }

  public isBlocked(email: string | null): boolean {
    if (!email) return false;
    const config = this.loadConfig();
    return config.blockedUsers.includes(email);
  }

  public getAdmins(): string[] {
    const config = this.loadConfig();
    return [...config.admins];
  }

  public getVerifiedUsers(): string[] {
    const config = this.loadConfig();
    return [...config.verifiedUsers];
  }

  public getMaxAnonymousVisits(): number {
    const config = this.loadConfig();
    return config.settings.maxAnonymousVisits;
  }

  public addAdmin(email: string): void {
    const config = this.loadConfig();
    if (!config.admins.includes(email)) {
      config.admins.push(email);
      // Note: In production, you might want to save this back to file
      // or use a database instead of JSON files
    }
  }

  public removeAdmin(email: string): void {
    const config = this.loadConfig();
    const index = config.admins.indexOf(email);
    if (index > -1) {
      config.admins.splice(index, 1);
    }
  }

  public addVerifiedUser(email: string): void {
    const config = this.loadConfig();
    if (!config.verifiedUsers.includes(email)) {
      config.verifiedUsers.push(email);
    }
  }

  public removeVerifiedUser(email: string): void {
    const config = this.loadConfig();
    const index = config.verifiedUsers.indexOf(email);
    if (index > -1) {
      config.verifiedUsers.splice(index, 1);
    }
  }

  public blockUser(email: string): void {
    const config = this.loadConfig();
    if (!config.blockedUsers.includes(email)) {
      config.blockedUsers.push(email);
    }
  }

  public unblockUser(email: string): void {
    const config = this.loadConfig();
    const index = config.blockedUsers.indexOf(email);
    if (index > -1) {
      config.blockedUsers.splice(index, 1);
    }
  }
}

export default UserRoleService;