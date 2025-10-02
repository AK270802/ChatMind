import { db } from "../../../db";
import { trades, users } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Cast db to proper type for drizzle operations
const typedDb = db as any;

export interface TradeStory {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  title: string;
  content: string;
  tradeData: {
    symbol: string;
    type: 'long' | 'short';
    entryPrice: number;
    exitPrice?: number;
    pnl?: number;
    entryDate: Date;
    exitDate?: Date;
    strategy?: string;
    tags?: string[];
  };
  insights: {
    keyLearning: string;
    emotionalState: string;
    riskManagement: string;
    marketConditions: string;
  };
  isAnonymous: boolean;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  isVerified?: boolean;
}

export interface CreateTradeStoryRequest {
  tradeId: string;
  title: string;
  content: string;
  insights: {
    keyLearning: string;
    emotionalState: string;
    riskManagement: string;
    marketConditions: string;
  };
  isAnonymous: boolean;
}

export interface Comment {
  id: string;
  storyId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  createdAt: Date;
  likes: number;
  isVerified?: boolean;
}

export class TradeStoriesService {
  async createTradeStory(userId: string, request: CreateTradeStoryRequest): Promise<TradeStory> {
    // Get the original trade data
    const [trade] = await typedDb
      .select()
      .from(trades)
      .where(eq(trades.id, request.tradeId));

    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.userId !== userId) {
      throw new Error('Unauthorized to create story for this trade');
    }

    // Get user info for non-anonymous stories
    let userInfo = { username: 'Anonymous' };
    if (!request.isAnonymous) {
      const [user] = await typedDb
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, userId));
      
      if (user) {
        userInfo = user;
      }
    }

    // Create trade story (in a real implementation, this would be saved to a trade_stories table)
    const story: TradeStory = {
      id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username: userInfo.username,
      // avatar: userInfo.avatar, // Avatar not in schema
      title: request.title,
      content: request.content,
      tradeData: {
        symbol: trade.symbol,
        type: trade.type,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice || undefined,
        pnl: trade.pnl || undefined,
        entryDate: trade.entryDate,
        exitDate: trade.exitDate || undefined,
        strategy: trade.strategy || undefined,
        tags: [] // Would be populated from trade tagging system
      },
      insights: request.insights,
      isAnonymous: request.isAnonymous,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date(),
      isVerified: false // Would be set based on user verification status
    };

    // In a real implementation, save to database here
    return story;
  }

  async getTradeStories(filters: {
    limit?: number;
    offset?: number;
    sortBy?: 'latest' | 'popular' | 'trending';
    tags?: string[];
    verifiedOnly?: boolean;
  } = {}): Promise<TradeStory[]> {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'latest',
      tags = [],
      verifiedOnly = false
    } = filters;

    // In a real implementation, this would query a trade_stories table
    // For now, return mock data that matches the structure
    const mockStories: TradeStory[] = [
      {
        id: 'story_1',
        userId: 'user_1',
        username: 'ProfitPro',
        avatar: undefined,
        title: 'My First Successful Options Trade',
        content: 'I had been studying options trading for months and finally decided to take the plunge with a Nifty call option. The key was patience and waiting for the right setup...',
        tradeData: {
          symbol: 'NIFTY',
          type: 'long',
          entryPrice: 150,
          exitPrice: 280,
          pnl: 130,
          entryDate: new Date('2024-01-15'),
          exitDate: new Date('2024-01-16'),
          strategy: 'Options Buying',
          tags: ['options', 'nifty', 'intraday']
        },
        insights: {
          keyLearning: 'Patience and proper entry timing are crucial for options trading',
          emotionalState: 'Initially nervous but confident in my analysis',
          riskManagement: 'Used only 2% of capital with strict stop-loss',
          marketConditions: 'Nifty was in strong uptrend with good volume'
        },
        isAnonymous: false,
        likes: 45,
        comments: 12,
        shares: 8,
        createdAt: new Date('2024-01-16'),
        isVerified: true
      },
      {
        id: 'story_2',
        userId: 'user_2',
        username: 'Anonymous',
        avatar: undefined,
        title: 'Learned from My Biggest Loss',
        content: 'This trade taught me the importance of position sizing and emotional control. I went all-in on a stock tip without proper research...',
        tradeData: {
          symbol: 'RELIANCE',
          type: 'long',
          entryPrice: 2450,
          exitPrice: 2180,
          pnl: -270,
          entryDate: new Date('2024-01-10'),
          exitDate: new Date('2024-01-12'),
          strategy: 'Swing Trading',
          tags: ['stocks', 'loss', 'lesson']
        },
        insights: {
          keyLearning: 'Never risk more than 2% on a single trade, always do your own research',
          emotionalState: 'Greedy and FOMO-driven, poor emotional control',
          riskManagement: 'No stop-loss, oversized position, broke all rules',
          marketConditions: 'Market was volatile, stock was overbought'
        },
        isAnonymous: true,
        likes: 89,
        comments: 23,
        shares: 15,
        createdAt: new Date('2024-01-12'),
        isVerified: false
      }
    ];

    // Apply filters
    let filteredStories = mockStories;

    if (verifiedOnly) {
      filteredStories = filteredStories.filter(story => story.isVerified);
    }

    if (tags.length > 0) {
      filteredStories = filteredStories.filter(story => 
        story.tradeData.tags?.some(tag => tags.includes(tag))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filteredStories.sort((a, b) => b.likes - a.likes);
        break;
      case 'trending':
        filteredStories.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
        break;
      case 'latest':
      default:
        filteredStories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    return filteredStories.slice(offset, offset + limit);
  }

  async getTradeStory(storyId: string): Promise<TradeStory | null> {
    const stories = await this.getTradeStories();
    return stories.find(story => story.id === storyId) || null;
  }

  async likeStory(storyId: string, userId: string): Promise<void> {
    // In a real implementation, this would update the likes count in the database
    // and prevent duplicate likes from the same user
    console.log(`User ${userId} liked story ${storyId}`);
  }

  async getComments(storyId: string): Promise<Comment[]> {
    // Mock comments data
    return [
      {
        id: 'comment_1',
        storyId,
        userId: 'user_3',
        username: 'TradingGuru',
        avatar: undefined,
        content: 'Great insights! I especially agree with your point about emotional control.',
        createdAt: new Date('2024-01-17'),
        likes: 5,
        isVerified: true
      },
      {
        id: 'comment_2',
        storyId,
        userId: 'user_4',
        username: 'NewbieTrader',
        avatar: undefined,
        content: 'This is really helpful for someone like me who\'s just starting out. Thank you for sharing!',
        createdAt: new Date('2024-01-17'),
        likes: 3,
        isVerified: false
      }
    ];
  }

  async addComment(storyId: string, userId: string, content: string): Promise<Comment> {
    const [user] = await typedDb
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId));

    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      storyId,
      userId,
      username: user?.username || 'Anonymous',
      // avatar: user?.avatar, // Avatar not in schema
      content,
      createdAt: new Date(),
      likes: 0,
      isVerified: false
    };

    // In a real implementation, save to database here
    return comment;
  }

  async getTrendingStories(limit: number = 5): Promise<TradeStory[]> {
    return this.getTradeStories({
      limit,
      sortBy: 'trending'
    });
  }

  async getVerifiedStories(limit: number = 10): Promise<TradeStory[]> {
    return this.getTradeStories({
      limit,
      verifiedOnly: true,
      sortBy: 'popular'
    });
  }

  async searchStories(query: string): Promise<TradeStory[]> {
    const allStories = await this.getTradeStories({ limit: 100 });
    const lowercaseQuery = query.toLowerCase();

    return allStories.filter(story => 
      story.title.toLowerCase().includes(lowercaseQuery) ||
      story.content.toLowerCase().includes(lowercaseQuery) ||
      story.tradeData.symbol.toLowerCase().includes(lowercaseQuery) ||
      story.insights.keyLearning.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const tradeStoriesService = new TradeStoriesService();
