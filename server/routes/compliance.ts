import { Router, Request, Response } from "express";
import { complianceService, ComplianceResult, SecurityEvent, AuditLog } from "../services/compliance";
import { storage } from "../storage";

const router = Router();

// Get compliance status
router.get("/status", async (req: Request, res: Response) => {
  try {
    // Get data for compliance checks
    // Note: In a real implementation, we would need admin-level methods
    // For now, we'll use placeholder data
    const users: any[] = [];
    const trades: any[] = [];
    
    const data = {
      users,
      trades,
      sessions: [], // Would get from session store in real implementation
      recentActions: [] // Would get from audit logs
    };

    const complianceResult = await complianceService.runComplianceCheck(data);
    
    res.json({
      timestamp: new Date(),
      overallScore: complianceResult.score,
      passed: complianceResult.passed,
      violations: complianceResult.violations,
      rules: complianceService.getComplianceRules()
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking compliance status", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Run compliance check on specific data
router.post("/check", async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ message: "Data is required for compliance check" });
    }

    const complianceResult = await complianceService.runComplianceCheck(data);
    
    res.json(complianceResult);
  } catch (error) {
    res.status(500).json({ message: "Error running compliance check", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Generate compliance report
router.get("/report", async (req: Request, res: Response) => {
  try {
    const report = await complianceService.generateComplianceReport();
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Error generating compliance report", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get compliance rules
router.get("/rules", async (req: Request, res: Response) => {
  try {
    const rules = complianceService.getComplianceRules();
    
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching compliance rules", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Update compliance rule
router.put("/rules/:ruleId", async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: "Enabled field must be a boolean" });
    }

    // In a real implementation, you would update the rule in the database
    // For now, we'll just acknowledge the request
    res.json({ message: `Rule ${ruleId} updated successfully`, enabled });
  } catch (error) {
    res.status(500).json({ message: "Error updating compliance rule", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get security events
router.get("/security-events", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const events = complianceService.getSecurityEvents(limit);
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching security events", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get audit logs
router.get("/audit-logs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = complianceService.getAuditLogs(limit);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching audit logs", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Log custom security event
router.post("/security-events", async (req: Request, res: Response) => {
  try {
    const { type, details, riskLevel } = req.body;
    
    if (!type || !details || !riskLevel) {
      return res.status(400).json({ message: "Type, details, and riskLevel are required" });
    }

    complianceService.logSecurityEvent({
      type,
      userId: req.user?.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details,
      riskLevel
    });

    res.json({ message: "Security event logged successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error logging security event", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get security dashboard data
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const events = complianceService.getSecurityEvents(1000);
    const logs = complianceService.getAuditLogs(1000);
    
    // Calculate statistics
    const eventStats = {
      total: events.length,
      critical: events.filter(e => e.riskLevel === 'critical').length,
      high: events.filter(e => e.riskLevel === 'high').length,
      medium: events.filter(e => e.riskLevel === 'medium').length,
      low: events.filter(e => e.riskLevel === 'low').length
    };

    const recentEvents = events.slice(-10);
    const recentLogs = logs.slice(-10);

    // Calculate events by type
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate events by hour (last 24 hours)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentEventsTimeline = events
      .filter(e => new Date(e.timestamp) >= twentyFourHoursAgo)
      .reduce((acc, event) => {
        const hour = new Date(event.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    res.json({
      stats: eventStats,
      recentEvents,
      recentLogs,
      eventsByType,
      eventsTimeline: recentEventsTimeline,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching security dashboard", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Export data with compliance check
router.post("/export", async (req: Request, res: Response) => {
  try {
    const { dataType, format = 'json' } = req.body;
    
    if (!dataType) {
      return res.status(400).json({ message: "Data type is required" });
    }

    // Log export event
    complianceService.logSecurityEvent({
      type: 'data_export',
      userId: req.user?.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details: { dataType, format },
      riskLevel: 'medium'
    });

    complianceService.logAudit({
      userId: req.user?.id,
      action: 'export_data',
      resource: dataType,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details: { dataType, format },
      result: 'success'
    });

    let data: any;
    let filename: string;

    switch (dataType) {
      case 'trades':
        // Note: In a real implementation, we would need admin-level methods
        data = [];
        filename = 'trades_export';
        break;
      case 'users':
        // Only allow admin to export users
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ message: "Insufficient permissions to export user data" });
        }
        // Note: In a real implementation, we would need admin-level methods
        data = [];
        filename = 'users_export';
        break;
      case 'compliance':
        data = await complianceService.generateComplianceReport();
        filename = 'compliance_report';
        break;
      case 'security':
        data = {
          events: complianceService.getSecurityEvents(1000),
          logs: complianceService.getAuditLogs(1000)
        };
        filename = 'security_data';
        break;
      default:
        return res.status(400).json({ message: "Invalid data type" });
    }

    // Sanitize data for export
    const sanitizedData = sanitizeDataForExport(data);

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(sanitizedData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.json(sanitizedData);
    }
  } catch (error) {
    res.status(500).json({ message: "Error exporting data", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Helper functions
function sanitizeDataForExport(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForExport(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Remove sensitive fields
      if (['password', 'apiKey', 'apiSecret', 'accessToken', 'refreshToken'].includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeDataForExport(value);
      }
    }
    
    return sanitized;
  }

  return data;
}

function convertToCSV(data: any): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export default router;
