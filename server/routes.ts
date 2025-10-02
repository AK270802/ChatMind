import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateAIAnalysis, generateDownloadableReport } from "./services/aiAnalysis";
import { parseCSVTrades, generateCSVTemplate } from "./services/csvParser";
import { insertTradeSchema, insertFeedbackSchema, tradeUploadSchema } from "@shared/schema";
import { z } from "zod";
import brokerRoutes from "./routes/broker";
import complianceRoutes from "./routes/compliance";
import tradeTaggingRoutes from "./routes/tradeTagging";
import csvImportRoutes from "./routes/csvImport";
import leaderboardsRoutes from "./routes/leaderboards";
import tradeStoriesRoutes from "./routes/tradeStories";
import mentorshipRoutes from "./routes/mentorship";
import gamificationRoutes from "./routes/gamification";
import { complianceService } from "./services/compliance";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Middleware to check coach role
const requireCoach = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user?.role !== 'coach' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Coach access required" });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // User profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const { password, ...userProfile } = req.user!;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      delete updates.id; // Prevent ID modification
      delete updates.password; // Use separate endpoint for password
      
      const updatedUser = await storage.updateUser(req.user!.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  // Trade management routes
  app.get("/api/trades", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const trades = await storage.getTradesByUser(req.user!.id, limit, offset);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Error fetching trades" });
    }
  });

  app.post("/api/trades", requireAuth, async (req, res) => {
    try {
      // Preprocess the request body to convert date strings to Date objects
      const processedBody = {
        ...req.body,
        entryDate: req.body.entryDate ? new Date(req.body.entryDate) : undefined,
        exitDate: req.body.exitDate ? new Date(req.body.exitDate) : undefined,
        userId: req.user!.id
      };
      
      const validatedTrade = insertTradeSchema.parse(processedBody);
      
      const trade = await storage.createTrade(validatedTrade);
      res.status(201).json(trade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating trade" });
    }
  });

  app.patch("/api/trades/:id", requireAuth, async (req, res) => {
    try {
      const tradeId = req.params.id;
      const updates = req.body;
      
      // Preprocess the updates to convert date strings to Date objects
      const processedUpdates = {
        ...updates,
        entryDate: updates.entryDate ? new Date(updates.entryDate) : undefined,
        exitDate: updates.exitDate ? new Date(updates.exitDate) : undefined,
      };
      
      // Verify trade belongs to user
      const existingTrade = await storage.getTrade(tradeId);
      if (!existingTrade || existingTrade.userId !== req.user!.id) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      const updatedTrade = await storage.updateTrade(tradeId, processedUpdates);
      res.json(updatedTrade);
    } catch (error) {
      res.status(500).json({ message: "Error updating trade" });
    }
  });

  app.delete("/api/trades/:id", requireAuth, async (req, res) => {
    try {
      const tradeId = req.params.id;
      
      // Verify trade belongs to user
      const existingTrade = await storage.getTrade(tradeId);
      if (!existingTrade || existingTrade.userId !== req.user!.id) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      await storage.deleteTrade(tradeId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting trade" });
    }
  });

  // CSV/Excel upload route
  app.post("/api/trades/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const trades = parseCSVTrades(fileContent, req.user!.id);
      
      const createdTrades = await storage.createTrades(trades);
      res.status(201).json({
        message: `Successfully imported ${createdTrades.length} trades`,
        trades: createdTrades
      });
    } catch (error) {
      console.error('CSV upload error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Error processing file" });
    }
  });

  // Download CSV template
  app.get("/api/trades/template", (req, res) => {
    try {
      const template = generateCSVTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="trade_template.csv"');
      res.send(template);
    } catch (error) {
      res.status(500).json({ message: "Error generating template" });
    }
  });

  // Trading statistics
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserTradeStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching statistics" });
    }
  });

  // AI Analysis routes
  app.post("/api/analysis/generate", requireAuth, async (req, res) => {
    try {
      const { coachPersonaId = 'mentor-guru' } = req.body;
      const trades = await storage.getTradesByUser(req.user!.id);
      
      // Get user profile for enhanced analysis
      const userProfile = req.user;
      
      const analysis = await generateAIAnalysis(trades, userProfile, coachPersonaId);
      
      // Store the analysis report
      const reportId = await storage.createAnalysisReport({
        userId: req.user!.id,
        reportType: 'daily',
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        insights: analysis.insights,
        improvements: analysis.improvements,
        recommendations: analysis.recommendations,
        metrics: analysis.metrics,
        modelUsed: analysis.modelUsed,
        coachPersona: analysis.coachPersona
      });

      // Add report ID to response
      analysis.reportId = reportId;

      res.json(analysis);
    } catch (error) {
      console.error('AI Analysis error:', error);
      res.status(500).json({ 
        message: "Error generating analysis", 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check if Ollama is running locally or configure OpenAI/Gemini API keys'
      });
    }
  });

  app.get("/api/analysis/reports", requireAuth, async (req, res) => {
    try {
      const reports = await storage.getAnalysisReportsByUser(req.user!.id);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analysis reports" });
    }
  });

  // Download analysis report
  app.get("/api/analysis/download/:reportId", requireAuth, async (req, res) => {
    try {
      const { reportId } = req.params;
      const { format = 'json' } = req.query;
      
      // Get the report
      const report = await storage.getAnalysisReport(reportId);
      if (!report || report.userId !== req.user!.id) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Convert stored report to AIAnalysisResult format
      const analysisResult = {
        insights: report.insights || [],
        improvements: report.improvements || [],
        metrics: report.metrics || {},
        recommendations: report.recommendations || [],
        modelUsed: report.modelUsed,
        generatedAt: report.createdAt?.toISOString(),
        coachPersona: report.coachPersona
      };

      // Generate downloadable content
      const content = generateDownloadableReport(analysisResult, format as 'pdf' | 'csv' | 'json');
      
      // Set appropriate headers based on format
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = `trading-analysis-${timestamp}`;
      let contentType = 'application/json';
      
      switch (format) {
        case 'csv':
          filename += '.csv';
          contentType = 'text/csv';
          break;
        case 'pdf':
          filename += '.html'; // HTML for PDF conversion
          contentType = 'text/html';
          break;
        default:
          filename += '.json';
          contentType = 'application/json';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: "Error downloading report" });
    }
  });

  // Get available AI models
  app.get("/api/analysis/models", requireAuth, async (req, res) => {
    try {
      const { multiModelClient } = await import("./services/ai/multiModelClient");
      const availableModels = await multiModelClient.getAvailableModels();
      res.json({ 
        available: availableModels,
        configured: process.env.AI_MODELS_ENABLED?.split(',') || ['ollama']
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching available models" });
    }
  });

  // Subscription routes (mock implementation)
  app.get("/api/subscription", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      res.json({
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        nextBilling: user.subscriptionEndsAt,
        features: {
          basic: ['Up to 100 trades/month', 'Basic analytics', 'CSV import', 'Email support'],
          pro: ['Unlimited trades', 'Advanced analytics & AI insights', 'Auto broker sync', 'Weekly coaching calls', 'Priority support'],
          enterprise: ['Multi-user access', 'Custom integrations', 'Dedicated account manager', 'White-label options', '24/7 phone support']
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscription" });
    }
  });

  // Mock subscription upgrade (would integrate with Stripe)
  app.post("/api/subscription/upgrade", requireAuth, async (req, res) => {
    try {
      const { plan } = req.body;
      
      if (!['basic', 'pro', 'enterprise'].includes(plan)) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      // In production, this would integrate with Stripe:
      /*
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan === 'pro' ? 7900 : 19900, // $79 or $199
        currency: 'usd',
        customer: user.stripeCustomerId,
      });
      */

      const updatedUser = await storage.updateUser(req.user!.id, {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      res.json({
        message: `Successfully upgraded to ${plan} plan`,
        subscription: {
          plan: updatedUser?.subscriptionPlan,
          status: updatedUser?.subscriptionStatus,
          nextBilling: updatedUser?.subscriptionEndsAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error upgrading subscription" });
    }
  });

  // Coach/Admin routes
  app.get("/api/admin/students", requireCoach, async (req, res) => {
    try {
      const students = await storage.getStudentsByCoach(req.user!.id);
      
      // Get additional stats for each student
      const studentsWithStats = await Promise.all(
        students.map(async (student) => {
          const stats = await storage.getUserTradeStats(student.id);
          const recentTrades = await storage.getTradesByUser(student.id, 5);
          
          return {
            ...student,
            stats,
            recentTradeCount: recentTrades.length,
            lastTradeDate: recentTrades[0]?.createdAt || null
          };
        })
      );
      
      res.json(studentsWithStats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching students" });
    }
  });

  app.post("/api/admin/students", requireCoach, async (req, res) => {
    try {
      const { studentId } = req.body;
      
      const student = await storage.getUser(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      await storage.assignStudentToCoach({
        coachId: req.user!.id,
        studentId: studentId,
        status: 'active'
      });

      res.json({ message: "Student assigned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error assigning student" });
    }
  });

  app.post("/api/admin/feedback", requireCoach, async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        coachId: req.user!.id
      });
      
      const feedback = await storage.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating feedback" });
    }
  });

  app.get("/api/admin/feedback", requireCoach, async (req, res) => {
    try {
      const feedback = await storage.getFeedbackByCoach(req.user!.id);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Error fetching feedback" });
    }
  });

  // Student feedback view
  app.get("/api/feedback", requireAuth, async (req, res) => {
    try {
      const feedback = await storage.getFeedbackByStudent(req.user!.id);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Error fetching feedback" });
    }
  });

  // Broker integration routes
  app.use("/api/broker", requireAuth, brokerRoutes);

  // Compliance and security routes
  app.use("/api/compliance", requireAuth, complianceRoutes);
  
  // Trade tagging routes
  app.use("/api/trade-tagging", requireAuth, tradeTaggingRoutes);
  
  // CSV import routes
  app.use("/api/csv-import", requireAuth, csvImportRoutes);
  
  // Social features routes
  app.use("/api/leaderboards", requireAuth, leaderboardsRoutes);
  app.use("/api/trade-stories", requireAuth, tradeStoriesRoutes);
  app.use("/api/mentorship", requireAuth, mentorshipRoutes);
  
  // Gamification routes
  app.use("/api/gamification", requireAuth, gamificationRoutes);
  
  // Apply security middleware to all API routes
  app.use("/api", complianceService.securityMiddleware.bind(complianceService));

  const httpServer = createServer(app);
  return httpServer;
}
