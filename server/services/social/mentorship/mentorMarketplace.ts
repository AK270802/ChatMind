import { db } from "../../../db";
import { users } from "../../../../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface MentorProfile {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  bio: string;
  specializations: string[];
  experience: number; // years
  verificationStatus: 'pending' | 'verified' | 'rejected';
  credentials: {
    sebiRegistered?: boolean;
    certifications: string[];
    achievements: string[];
    brokerConnections: string[];
  };
  stats: {
    totalStudents: number;
    averageRating: number;
    totalReviews: number;
    successRate: number;
    totalMentoringHours: number;
  };
  pricing: {
    hourlyRate: number;
    packageDiscounts: {
      hours: number;
      discount: number;
    }[];
  };
  availability: {
    timezone: string;
    availableSlots: TimeSlot[];
  };
  socialProof: {
    testimonials: Testimonial[];
    caseStudies: CaseStudy[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface Testimonial {
  id: string;
  studentId: string;
  studentName: string;
  content: string;
  rating: number;
  createdAt: Date;
  isVerified: boolean;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  tags: string[];
  createdAt: Date;
}

export interface MentorshipSession {
  id: string;
  mentorId: string;
  studentId: string;
  type: 'one_on_one' | 'group' | 'workshop';
  title: string;
  description: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  meetingLink?: string;
  recordingUrl?: string;
  notes?: string;
  feedback?: {
    rating: number;
    comment: string;
    givenAt: Date;
  };
  createdAt: Date;
}

export interface BookingRequest {
  mentorId: string;
  studentId: string;
  preferredDate: Date;
  duration: number;
  type: 'one_on_one' | 'group' | 'workshop';
  topic: string;
  description: string;
}

export class MentorMarketplaceService {
  async createMentorProfile(userId: string, profileData: {
    bio: string;
    specializations: string[];
    experience: number;
    hourlyRate: number;
    credentials: {
      sebiRegistered?: boolean;
      certifications: string[];
      achievements: string[];
      brokerConnections: string[];
    };
  }): Promise<MentorProfile> {
    const [user] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error('User not found');
    }

    const profile: MentorProfile = {
      id: `mentor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username: user.username || '',
      avatar: undefined, // Avatar field not available in users table
      bio: profileData.bio,
      specializations: profileData.specializations,
      experience: profileData.experience,
      verificationStatus: 'pending',
      credentials: profileData.credentials,
      stats: {
        totalStudents: 0,
        averageRating: 0,
        totalReviews: 0,
        successRate: 0,
        totalMentoringHours: 0
      },
      pricing: {
        hourlyRate: profileData.hourlyRate,
        packageDiscounts: [
          { hours: 5, discount: 10 },
          { hours: 10, discount: 15 },
          { hours: 20, discount: 20 }
        ]
      },
      availability: {
        timezone: 'Asia/Kolkata',
        availableSlots: []
      },
      socialProof: {
        testimonials: [],
        caseStudies: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, save to database here
    return profile;
  }

  async getMentors(filters: {
    specialization?: string;
    minExperience?: number;
    maxHourlyRate?: number;
    verificationStatus?: 'verified' | 'pending';
    minRating?: number;
    sortBy?: 'rating' | 'experience' | 'price' | 'students';
    limit?: number;
    offset?: number;
  } = {}): Promise<MentorProfile[]> {
    const {
      specialization,
      minExperience,
      maxHourlyRate,
      verificationStatus,
      minRating,
      sortBy = 'rating',
      limit = 20,
      offset = 0
    } = filters;

    // Mock mentor data
    const mockMentors: MentorProfile[] = [
      {
        id: 'mentor_1',
        userId: 'user_1',
        username: 'Rajesh Sharma',
        avatar: undefined,
        bio: 'SEBI registered research analyst with 15+ years of experience in Indian equity markets. Specialized in technical analysis and options trading strategies.',
        specializations: ['Technical Analysis', 'Options Trading', 'Risk Management'],
        experience: 15,
        verificationStatus: 'verified',
        credentials: {
          sebiRegistered: true,
          certifications: ['SEBI Research Analyst', 'NISM Series VIII'],
          achievements: ['Top 10 Technical Analysts India 2023', 'Options Trading Champion'],
          brokerConnections: ['Zerodha', 'Upstox', 'Angel One']
        },
        stats: {
          totalStudents: 250,
          averageRating: 4.8,
          totalReviews: 189,
          successRate: 85,
          totalMentoringHours: 1500
        },
        pricing: {
          hourlyRate: 2000,
          packageDiscounts: [
            { hours: 5, discount: 10 },
            { hours: 10, discount: 15 },
            { hours: 20, discount: 20 }
          ]
        },
        availability: {
          timezone: 'Asia/Kolkata',
          availableSlots: [
            { dayOfWeek: 1, startTime: '18:00', endTime: '20:00' },
            { dayOfWeek: 2, startTime: '18:00', endTime: '20:00' },
            { dayOfWeek: 3, startTime: '18:00', endTime: '20:00' },
            { dayOfWeek: 4, startTime: '18:00', endTime: '20:00' },
            { dayOfWeek: 5, startTime: '18:00', endTime: '20:00' }
          ]
        },
        socialProof: {
          testimonials: [
            {
              id: 'test_1',
              studentId: 'student_1',
              studentName: 'Amit Kumar',
              content: 'Rajesh sir\'s guidance transformed my trading. His options strategies are practical and profitable.',
              rating: 5,
              createdAt: new Date('2024-01-15'),
              isVerified: true
            },
            {
              id: 'test_2',
              studentId: 'student_2',
              studentName: 'Priya Singh',
              content: 'Best mentor for technical analysis. His chart reading skills are exceptional.',
              rating: 5,
              createdAt: new Date('2024-01-10'),
              isVerified: true
            }
          ],
          caseStudies: [
            {
              id: 'case_1',
              title: 'Bank Nifty Options Strategy',
              description: 'Developed a systematic approach for Bank Nifty weekly options trading',
              challenge: 'Student was struggling with consistent losses in options trading',
              solution: 'Implemented structured risk management and technical analysis based entry/exit rules',
              results: 'Student achieved 65% success rate with 2:1 risk-reward ratio',
              tags: ['Bank Nifty', 'Options', 'Technical Analysis'],
              createdAt: new Date('2024-01-01')
            }
          ]
        },
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'mentor_2',
        userId: 'user_2',
        username: 'Priya Patel',
        avatar: undefined,
        bio: 'Expert in fundamental analysis and long-term investing. Focus on multibagger stocks and portfolio management for Indian markets.',
        specializations: ['Fundamental Analysis', 'Long-term Investing', 'Portfolio Management'],
        experience: 12,
        verificationStatus: 'verified',
        credentials: {
          sebiRegistered: false,
          certifications: ['CFA Level 2', 'NISM Series V'],
          achievements: ['Portfolio Manager of the Year 2022', 'Best Stock Picker India'],
          brokerConnections: ['Zerodha', 'Groww']
        },
        stats: {
          totalStudents: 180,
          averageRating: 4.6,
          totalReviews: 142,
          successRate: 78,
          totalMentoringHours: 1200
        },
        pricing: {
          hourlyRate: 1500,
          packageDiscounts: [
            { hours: 5, discount: 10 },
            { hours: 10, discount: 15 },
            { hours: 20, discount: 20 }
          ]
        },
        availability: {
          timezone: 'Asia/Kolkata',
          availableSlots: [
            { dayOfWeek: 1, startTime: '19:00', endTime: '21:00' },
            { dayOfWeek: 3, startTime: '19:00', endTime: '21:00' },
            { dayOfWeek: 5, startTime: '19:00', endTime: '21:00' },
            { dayOfWeek: 6, startTime: '10:00', endTime: '12:00' }
          ]
        },
        socialProof: {
          testimonials: [
            {
              id: 'test_3',
              studentId: 'student_3',
              studentName: 'Vikram Mehta',
              content: 'Priya\'s fundamental analysis approach helped me identify multibagger stocks. Her portfolio management guidance is excellent.',
              rating: 5,
              createdAt: new Date('2024-01-12'),
              isVerified: true
            }
          ],
          caseStudies: []
        },
        createdAt: new Date('2023-08-01'),
        updatedAt: new Date('2024-01-18')
      }
    ];

    let filteredMentors = mockMentors;

    // Apply filters
    if (specialization) {
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.specializations.includes(specialization)
      );
    }

    if (minExperience) {
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.experience >= minExperience!
      );
    }

    if (maxHourlyRate) {
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.pricing.hourlyRate <= maxHourlyRate!
      );
    }

    if (verificationStatus) {
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.verificationStatus === verificationStatus!
      );
    }

    if (minRating) {
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.stats.averageRating >= minRating!
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        filteredMentors.sort((a, b) => b.stats.averageRating - a.stats.averageRating);
        break;
      case 'experience':
        filteredMentors.sort((a, b) => b.experience - a.experience);
        break;
      case 'price':
        filteredMentors.sort((a, b) => a.pricing.hourlyRate - b.pricing.hourlyRate);
        break;
      case 'students':
        filteredMentors.sort((a, b) => b.stats.totalStudents - a.stats.totalStudents);
        break;
    }

    return filteredMentors.slice(offset, offset + limit);
  }

  async getMentorProfile(mentorId: string): Promise<MentorProfile | null> {
    const mentors = await this.getMentors();
    return mentors.find(mentor => mentor.id === mentorId) || null;
  }

  async bookSession(bookingRequest: BookingRequest): Promise<MentorshipSession> {
    const mentor = await this.getMentorProfile(bookingRequest.mentorId);
    if (!mentor) {
      throw new Error('Mentor not found');
    }

    // Check if mentor is available at the requested time
    const isAvailable = this.checkAvailability(mentor, bookingRequest.preferredDate);
    if (!isAvailable) {
      throw new Error('Mentor not available at the requested time');
    }

    const session: MentorshipSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mentorId: bookingRequest.mentorId,
      studentId: bookingRequest.studentId,
      type: bookingRequest.type,
      title: bookingRequest.topic,
      description: bookingRequest.description,
      scheduledAt: bookingRequest.preferredDate,
      duration: bookingRequest.duration,
      status: 'scheduled',
      price: this.calculateSessionPrice(mentor, bookingRequest.duration),
      createdAt: new Date()
    };

    // In a real implementation, save to database and send notifications
    return session;
  }

  private checkAvailability(mentor: MentorProfile, date: Date): boolean {
    const dayOfWeek = date.getDay();
    const time = date.toTimeString().slice(0, 5); // HH:mm format

    return mentor.availability.availableSlots.some(slot =>
      slot.dayOfWeek === dayOfWeek &&
      time >= slot.startTime &&
      time <= slot.endTime
    );
  }

  private calculateSessionPrice(mentor: MentorProfile, duration: number): number {
    const basePrice = (mentor.pricing.hourlyRate * duration) / 60;
    
    // Apply package discounts if applicable
    const applicableDiscount = mentor.pricing.packageDiscounts.find(discount =>
      duration >= discount.hours * 60
    );

    if (applicableDiscount) {
      return basePrice * (1 - applicableDiscount.discount / 100);
    }

    return basePrice;
  }

  async getStudentSessions(studentId: string): Promise<MentorshipSession[]> {
    // In a real implementation, get from database
    return [];
  }

  async getMentorSessions(mentorId: string): Promise<MentorshipSession[]> {
    // In a real implementation, get from database
    return [];
  }

  async updateSessionStatus(sessionId: string, status: MentorshipSession['status']): Promise<void> {
    // In a real implementation, update in database
  }

  async addSessionFeedback(sessionId: string, feedback: { rating: number; comment: string }): Promise<void> {
    // In a real implementation, update in database and recalculate mentor stats
  }

  async getSpecializations(): Promise<string[]> {
    const mentors = await this.getMentors();
    const allSpecializations = mentors.flatMap(mentor => mentor.specializations);
    return Array.from(new Set(allSpecializations));
  }

  async getTopMentors(limit: number = 5): Promise<MentorProfile[]> {
    return this.getMentors({
      verificationStatus: 'verified',
      minRating: 4.5,
      sortBy: 'rating',
      limit
    });
  }

  async searchMentors(query: string): Promise<MentorProfile[]> {
    const allMentors = await this.getMentors({ limit: 100 });
    const lowercaseQuery = query.toLowerCase();

    return allMentors.filter(mentor =>
      mentor.username.toLowerCase().includes(lowercaseQuery) ||
      mentor.bio.toLowerCase().includes(lowercaseQuery) ||
      mentor.specializations.some(spec => spec.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const mentorMarketplaceService = new MentorMarketplaceService();
