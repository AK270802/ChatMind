import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: 'data_protection' | 'financial' | 'privacy' | 'security' | 'audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  checkFunction: (data: any) => Promise<ComplianceResult>;
}

export interface ComplianceResult {
  passed: boolean;
  violations: ComplianceViolation[];
  score: number; // 0-100
}

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  timestamp: Date;
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'data_access' | 'api_call' | 'file_upload' | 'data_export';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: any;
  result: 'success' | 'failure' | 'error';
}

export class ComplianceService {
  private rules: Map<string, ComplianceRule> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private auditLogs: AuditLog[] = [];
  
  constructor() {
    this.initializeComplianceRules();
  }

  private initializeComplianceRules() {
    // Data Protection Rules
    this.addRule({
      id: 'data_encryption',
      name: 'Data Encryption at Rest',
      description: 'All sensitive data must be encrypted at rest',
      type: 'data_protection',
      severity: 'high',
      enabled: true,
      checkFunction: this.checkDataEncryption.bind(this)
    });

    this.addRule({
      id: 'pii_protection',
      name: 'PII Protection',
      description: 'Personal Identifiable Information must be properly protected',
      type: 'privacy',
      severity: 'critical',
      enabled: true,
      checkFunction: this.checkPIIProtection.bind(this)
    });

    this.addRule({
      id: 'data_retention',
      name: 'Data Retention Policy',
      description: 'Data must not be retained longer than necessary',
      type: 'data_protection',
      severity: 'medium',
      enabled: true,
      checkFunction: this.checkDataRetention.bind(this)
    });

    // Financial Compliance Rules
    this.addRule({
      id: 'trade_validation',
      name: 'Trade Data Validation',
      description: 'All trade data must be validated for accuracy and completeness',
      type: 'financial',
      severity: 'high',
      enabled: true,
      checkFunction: this.checkTradeValidation.bind(this)
    });

    this.addRule({
      id: 'risk_limits',
      name: 'Risk Limits Compliance',
      description: 'Trading activities must comply with risk limits',
      type: 'financial',
      severity: 'high',
      enabled: true,
      checkFunction: this.checkRiskLimits.bind(this)
    });

    // Security Rules
    this.addRule({
      id: 'password_policy',
      name: 'Password Policy Compliance',
      description: 'All user passwords must meet security requirements',
      type: 'security',
      severity: 'high',
      enabled: true,
      checkFunction: this.checkPasswordPolicy.bind(this)
    });

    this.addRule({
      id: 'session_management',
      name: 'Session Management',
      description: 'User sessions must be properly managed and secured',
      type: 'security',
      severity: 'medium',
      enabled: true,
      checkFunction: this.checkSessionManagement.bind(this)
    });

    // Audit Rules
    this.addRule({
      id: 'audit_trail',
      name: 'Audit Trail Completeness',
      description: 'All critical actions must have complete audit trails',
      type: 'audit',
      severity: 'high',
      enabled: true,
      checkFunction: this.checkAuditTrail.bind(this)
    });
  }

  private addRule(rule: ComplianceRule) {
    this.rules.set(rule.id, rule);
  }

  async runComplianceCheck(data?: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    let totalScore = 0;
    let enabledRulesCount = 0;

    for (const rule of Array.from(this.rules.values())) {
      if (!rule.enabled) continue;

      enabledRulesCount++;
      try {
        const result = await rule.checkFunction(data);
        if (!result.passed) {
          violations.push(...result.violations);
        }
        totalScore += result.score;
      } catch (error) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          description: `Compliance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: rule.severity,
          recommendation: 'Review and fix the compliance check implementation',
          timestamp: new Date()
        });
      }
    }

    const overallScore = enabledRulesCount > 0 ? Math.round(totalScore / enabledRulesCount) : 0;

    return {
      passed: violations.length === 0,
      violations,
      score: overallScore
    };
  }

  // Compliance Check Functions
  private async checkDataEncryption(data: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    
    // Check if sensitive fields are encrypted
    const sensitiveFields = ['password', 'apiKey', 'apiSecret', 'accessToken'];
    
    for (const field of sensitiveFields) {
      if (data[field] && typeof data[field] === 'string') {
        // Simple check - in real implementation, verify encryption
        if (!data[field].startsWith('$2a$') && !data[field].startsWith('$2b$')) {
          violations.push({
            ruleId: 'data_encryption',
            ruleName: 'Data Encryption at Rest',
            description: `Field ${field} appears to be unencrypted`,
            severity: 'high',
            recommendation: 'Ensure all sensitive data is properly encrypted',
            timestamp: new Date()
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 25))
    };
  }

  private async checkPIIProtection(data: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    
    // Check for PII patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /\b\d{10}\b/;
    const aadharRegex = /\b\d{4}\s\d{4}\s\d{4}\b/; // Indian Aadhar format
    
    const textToCheck = JSON.stringify(data);
    
    if (emailRegex.test(textToCheck)) {
      violations.push({
        ruleId: 'pii_protection',
        ruleName: 'PII Protection',
        description: 'Email addresses found in data without proper protection',
        severity: 'critical',
        recommendation: 'Mask or encrypt email addresses in logs and storage',
        timestamp: new Date()
      });
    }

    if (phoneRegex.test(textToCheck)) {
      violations.push({
        ruleId: 'pii_protection',
        ruleName: 'PII Protection',
        description: 'Phone numbers found in data without proper protection',
        severity: 'critical',
        recommendation: 'Mask or encrypt phone numbers in logs and storage',
        timestamp: new Date()
      });
    }

    if (aadharRegex.test(textToCheck)) {
      violations.push({
        ruleId: 'pii_protection',
        ruleName: 'PII Protection',
        description: 'Aadhar numbers found in data without proper protection',
        severity: 'critical',
        recommendation: 'Mask or encrypt Aadhar numbers in logs and storage',
        timestamp: new Date()
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 33))
    };
  }

  private async checkDataRetention(data: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    
    // Check for old data (older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    if (data.createdAt && new Date(data.createdAt) < ninetyDaysAgo) {
      violations.push({
        ruleId: 'data_retention',
        ruleName: 'Data Retention Policy',
        description: 'Data older than 90 days found',
        severity: 'medium',
        recommendation: 'Archive or delete old data according to retention policy',
        timestamp: new Date()
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : 75
    };
  }

  private async checkTradeValidation(data: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    
    if (data.trades) {
      for (const trade of data.trades) {
        // Validate required fields
        if (!trade.symbol || !trade.type || !trade.quantity || !trade.entryPrice) {
          violations.push({
            ruleId: 'trade_validation',
            ruleName: 'Trade Data Validation',
            description: `Trade ${trade.id || 'unknown'} missing required fields`,
            severity: 'high',
            recommendation: 'Ensure all trades have complete and valid data',
            timestamp: new Date()
          });
        }

        // Validate numeric values
        if (trade.quantity && (isNaN(Number(trade.quantity)) || Number(trade.quantity) <= 0)) {
          violations.push({
            ruleId: 'trade_validation',
            ruleName: 'Trade Data Validation',
            description: `Trade ${trade.id || 'unknown'} has invalid quantity`,
            severity: 'high',
            recommendation: 'Ensure all numeric trade values are valid',
            timestamp: new Date()
          });
        }

        if (trade.entryPrice && (isNaN(Number(trade.entryPrice)) || Number(trade.entryPrice) <= 0)) {
          violations.push({
            ruleId: 'trade_validation',
            ruleName: 'Trade Data Validation',
            description: `Trade ${trade.id || 'unknown'} has invalid entry price`,
            severity: 'high',
            recommendation: 'Ensure all numeric trade values are valid',
            timestamp: new Date()
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 20))
    };
  }

  private async checkRiskLimits(data: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    
    // Check for excessive position sizes
    if (data.trades) {
      const positionSizes = new Map<string, number>();
      
      for (const trade of data.trades) {
        const symbol = trade.symbol;
        const quantity = Number(trade.quantity) || 0;
        const price = Number(trade.entryPrice) || 0;
        const value = quantity * price;
        
        positionSizes.set(symbol, (positionSizes.get(symbol) || 0) + value);
      }

      // Check if any position exceeds $100,000
      const maxPositionSize = 100000;
      for (const [symbol, size] of Array.from(positionSizes.entries())) {
        if (size > maxPositionSize) {
          violations.push({
            ruleId: 'risk_limits',
            ruleName: 'Risk Limits Compliance',
            description: `Position in ${symbol} exceeds maximum allowed size of $${maxPositionSize}`,
            severity: 'high',
            recommendation: 'Reduce position size or increase risk limits',
            timestamp: new Date()
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 25))
    };
  }

  private async checkPasswordPolicy(data: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    
    if (data.users) {
      for (const user of data.users) {
        if (user.password) {
          const password = user.password;
          
          // Check password length
          if (password.length < 8) {
            violations.push({
              ruleId: 'password_policy',
              ruleName: 'Password Policy Compliance',
              description: `User ${user.username || user.id} has password shorter than 8 characters`,
              severity: 'high',
              recommendation: 'Enforce minimum password length of 8 characters',
              timestamp: new Date()
            });
          }

          // Check password complexity
          if (!/[A-Z]/.test(password)) {
            violations.push({
              ruleId: 'password_policy',
              ruleName: 'Password Policy Compliance',
              description: `User ${user.username || user.id} password missing uppercase letter`,
              severity: 'medium',
              recommendation: 'Require uppercase letters in passwords',
              timestamp: new Date()
            });
          }

          if (!/[a-z]/.test(password)) {
            violations.push({
              ruleId: 'password_policy',
              ruleName: 'Password Policy Compliance',
              description: `User ${user.username || user.id} password missing lowercase letter`,
              severity: 'medium',
              recommendation: 'Require lowercase letters in passwords',
              timestamp: new Date()
            });
          }

          if (!/\d/.test(password)) {
            violations.push({
              ruleId: 'password_policy',
              ruleName: 'Password Policy Compliance',
              description: `User ${user.username || user.id} password missing number`,
              severity: 'medium',
              recommendation: 'Require numbers in passwords',
              timestamp: new Date()
            });
          }

          if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            violations.push({
              ruleId: 'password_policy',
              ruleName: 'Password Policy Compliance',
              description: `User ${user.username || user.id} password missing special character`,
              severity: 'medium',
              recommendation: 'Require special characters in passwords',
              timestamp: new Date()
            });
          }
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 10))
    };
  }

  private async checkSessionManagement(data: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    
    // Check session timeout
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (data.sessions) {
      for (const session of data.sessions) {
        const sessionAge = Date.now() - new Date(session.createdAt).getTime();
        
        if (sessionAge > maxSessionAge) {
          violations.push({
            ruleId: 'session_management',
            ruleName: 'Session Management',
            description: `Session ${session.id} has exceeded maximum age`,
            severity: 'medium',
            recommendation: 'Implement session timeout and automatic logout',
            timestamp: new Date()
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 25))
    };
  }

  private async checkAuditTrail(data: any): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    
    // Check if critical actions have audit logs
    const criticalActions = ['login', 'logout', 'create_trade', 'update_trade', 'delete_trade', 'export_data'];
    
    if (data.recentActions) {
      const auditedActions = new Set(data.recentActions.map((action: any) => action.action));
      
      for (const criticalAction of criticalActions) {
        if (!auditedActions.has(criticalAction)) {
          violations.push({
            ruleId: 'audit_trail',
            ruleName: 'Audit Trail Completeness',
            description: `Critical action '${criticalAction}' missing from audit trail`,
            severity: 'high',
            recommendation: 'Ensure all critical actions are logged',
            timestamp: new Date()
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 20))
    };
  }

  // Security Event Management
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    this.securityEvents.push(securityEvent);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Alert for critical events
    if (event.riskLevel === 'critical') {
      this.alertSecurityTeam(securityEvent);
    }
  }

  // Audit Log Management
  logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const auditLog: AuditLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    this.auditLogs.push(auditLog);
    
    // Keep only last 5000 logs
    if (this.auditLogs.length > 5000) {
      this.auditLogs = this.auditLogs.slice(-5000);
    }
  }

  // Security Middleware
  securityMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Log security event
    this.logSecurityEvent({
      type: 'api_call',
      userId: req.user?.id,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: this.sanitizeRequestBody(req.body)
      },
      riskLevel: this.calculateRiskLevel(req)
    });

    // Log audit trail
    this.logAudit({
      userId: req.user?.id,
      action: `${req.method} ${req.path}`,
      resource: req.path,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details: {
        method: req.method,
        query: req.query,
        body: this.sanitizeRequestBody(req.body)
      },
      result: 'success'
    });

    next();
  }

  // Helper Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return {};
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'apiKey', 'apiSecret', 'accessToken', 'refreshToken'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private calculateRiskLevel(req: Request): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // High-risk paths
    const highRiskPaths = ['/api/auth/login', '/api/auth/register', '/api/admin', '/api/broker'];
    if (highRiskPaths.some(path => req.path.startsWith(path))) {
      riskScore += 3;
    }

    // Sensitive methods
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      riskScore += 2;
    }

    // Authentication status
    if (!req.user) {
      riskScore += 2;
    }

    // Rate limiting would be checked here in a real implementation

    if (riskScore >= 6) return 'critical';
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  private alertSecurityTeam(event: SecurityEvent): void {
    // In a real implementation, this would send alerts to security team
    console.error('CRITICAL SECURITY EVENT:', event);
    
    // Could integrate with email, Slack, PagerDuty, etc.
  }

  // Getters for monitoring
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  getAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  getComplianceRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }

  async generateComplianceReport(): Promise<any> {
    const complianceResult = await this.runComplianceCheck();
    
    return {
      timestamp: new Date(),
      overallScore: complianceResult.score,
      passed: complianceResult.passed,
      violations: complianceResult.violations,
      rules: this.getComplianceRules(),
      securityEvents: this.getSecurityEvents(50),
      auditLogs: this.getAuditLogs(50),
      recommendations: this.generateRecommendations(complianceResult.violations)
    };
  }

  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];
    
    const violationCounts = violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (violationCounts.critical > 0) {
      recommendations.push('Address critical violations immediately - they pose severe security or compliance risks');
    }

    if (violationCounts.high > 0) {
      recommendations.push('Review and fix high-severity violations within 24 hours');
    }

    if (violationCounts.medium > 0) {
      recommendations.push('Plan to address medium-severity violations within the next week');
    }

    if (violations.length > 0) {
      recommendations.push('Schedule regular compliance audits to prevent future violations');
    }

    recommendations.push('Implement automated compliance monitoring and alerting');

    return recommendations;
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();
