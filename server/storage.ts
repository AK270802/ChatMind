import { 
  users, 
  trades, 
  feedback, 
  aiAnalysisReports, 
  coachStudents,
  type User, 
  type InsertUser,
  type Trade,
  type InsertTrade,
  type Feedback,
  type InsertFeedback,
  type AiAnalysisReport,
  type InsertAiAnalysisReport,
  type CoachStudent,
  type InsertCoachStudent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Trades
  getTrade(id: string): Promise<Trade | undefined>;
  getTradesByUser(userId: string, limit?: number, offset?: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  createTrades(trades: InsertTrade[]): Promise<Trade[]>;
  updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | undefined>;
  deleteTrade(id: string): Promise<void>;
  getUserTradeStats(userId: string): Promise<any>;
  
  // Feedback
  getFeedbackByStudent(studentId: string): Promise<Feedback[]>;
  getFeedbackByCoach(coachId: string): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: string, status: string): Promise<void>;
  
  // AI Analysis Reports
  getAnalysisReportsByUser(userId: string): Promise<AiAnalysisReport[]>;
  getAnalysisReport(reportId: string): Promise<AiAnalysisReport | undefined>;
  createAnalysisReport(report: InsertAiAnalysisReport): Promise<string>;
  
  // Coach-Student relationships
  getStudentsByCoach(coachId: string): Promise<User[]>;
  getCoachesByStudent(studentId: string): Promise<User[]>;
  assignStudentToCoach(coachStudent: InsertCoachStudent): Promise<CoachStudent>;
  removeStudentFromCoach(coachId: string, studentId: string): Promise<void>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log("Insert payload →", insertUser);  // 👈 add this

    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Trades
  async getTrade(id: string): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade || undefined;
  }

  async getTradesByUser(userId: string, limit = 50, offset = 0): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db
      .insert(trades)
      .values(trade)
      .returning();
    return newTrade;
  }

  async createTrades(tradesList: InsertTrade[]): Promise<Trade[]> {
    return await db
      .insert(trades)
      .values(tradesList)
      .returning();
  }

  async updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | undefined> {
    const [trade] = await db
      .update(trades)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(trades.id, id))
      .returning();
    return trade || undefined;
  }

  async deleteTrade(id: string): Promise<void> {
    await db.delete(trades).where(eq(trades.id, id));
  }

  async getUserTradeStats(userId: string): Promise<any> {
    const stats = await db
      .select({
        totalTrades: count(),
        totalPnL: sql<number>`COALESCE(SUM(CASE WHEN pnl IS NOT NULL THEN pnl ELSE 0 END), 0)`,
        winningTrades: sql<number>`COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0)`,
        losingTrades: sql<number>`COALESCE(SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END), 0)`
      })
      .from(trades)
      .where(eq(trades.userId, userId));

    const [result] = stats;
    const winRate = result.totalTrades > 0 ? (result.winningTrades / result.totalTrades) * 100 : 0;

    return {
      ...result,
      winRate: winRate.toFixed(1)
    };
  }

  // Feedback
  async getFeedbackByStudent(studentId: string): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .where(eq(feedback.studentId, studentId))
      .orderBy(desc(feedback.createdAt));
  }

  async getFeedbackByCoach(coachId: string): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .where(eq(feedback.coachId, coachId))
      .orderBy(desc(feedback.createdAt));
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(feedbackData)
      .returning();
    return newFeedback;
  }

  async updateFeedbackStatus(id: string, status: string): Promise<void> {
    await db
      .update(feedback)
      .set({ status })
      .where(eq(feedback.id, id));
  }

  // AI Analysis Reports
  async getAnalysisReportsByUser(userId: string): Promise<AiAnalysisReport[]> {
    return await db
      .select()
      .from(aiAnalysisReports)
      .where(eq(aiAnalysisReports.userId, userId))
      .orderBy(desc(aiAnalysisReports.createdAt));
  }

  async getAnalysisReport(reportId: string): Promise<AiAnalysisReport | undefined> {
    const [report] = await db
      .select()
      .from(aiAnalysisReports)
      .where(eq(aiAnalysisReports.id, reportId))
      .limit(1);
    return report;
  }

  async createAnalysisReport(report: InsertAiAnalysisReport): Promise<string> {
    const [newReport] = await db
      .insert(aiAnalysisReports)
      .values(report)
      .returning();
    return newReport.id;
  }

  async deleteAnalysisReport(reportId: string): Promise<void> {
    await db.delete(aiAnalysisReports).where(eq(aiAnalysisReports.id, reportId));
  }

  async getStudentsByCoach(coachId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .innerJoin(coachStudents, eq(users.id, coachStudents.studentId))
      .where(and(
        eq(coachStudents.coachId, coachId),
        eq(coachStudents.status, 'active')
      ));

    return result.map(r => r.users);
  }

  async getCoachesByStudent(studentId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .innerJoin(coachStudents, eq(users.id, coachStudents.coachId))
      .where(and(
        eq(coachStudents.studentId, studentId),
        eq(coachStudents.status, 'active')
      ));

    return result.map(r => r.users);
  }

  async assignStudentToCoach(coachStudent: InsertCoachStudent): Promise<CoachStudent> {
    const [assignment] = await db
      .insert(coachStudents)
      .values(coachStudent)
      .returning();
    return assignment;
  }

  async removeStudentFromCoach(coachId: string, studentId: string): Promise<void> {
    await db
      .update(coachStudents)
      .set({ status: 'inactive' })
      .where(and(
        eq(coachStudents.coachId, coachId),
        eq(coachStudents.studentId, studentId)
      ));
  }
}

export const storage = new DatabaseStorage();
