import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MentorCard, { MentorProfile as ComponentMentorProfile, TimeSlot } from "@/components/social/mentor-card";
import { 
  Users, 
  Star, 
  Clock, 
  DollarSign, 
  Calendar,
  Video,
  MessageCircle,
  BookOpen,
  Award,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Play
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ApiMentorProfile {
  id: string;
  userId: string;
  bio: string;
  specializations: string[];
  experience: number;
  verificationStatus: string;
  credentials: Record<string, any>;
  stats: {
    totalStudents: number;
    rating: number;
    completedSessions: number;
  };
  pricing: {
    hourlyRate: number;
    packageDiscounts: Record<string, number>;
  };
  availability: {
    timeSlots: string[];
    timezone: string;
  };
  socialProof: {
    testimonials: Array<{
      studentName: string;
      rating: number;
      comment: string;
      date: string;
    }>;
    caseStudies: Array<{
      title: string;
      description: string;
      results: string;
    }>;
  };
  isActive: boolean;
  featured: boolean;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface MentorshipSession {
  id: string;
  mentorId: string;
  studentId: string;
  type: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  status: string;
  price: number;
  meetingLink?: string;
  recordingUrl?: string;
  notes?: string;
  feedback?: {
    rating: number;
    comment: string;
  };
  paymentStatus: string;
  mentor: {
    user: {
      firstName?: string;
      lastName?: string;
      username: string;
    };
  };
}

export default function MentorshipPage() {
  const [selectedTab, setSelectedTab] = useState("mentors");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");

  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<ApiMentorProfile[]>({
    queryKey: ["/api/mentorship/mentors"],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<MentorshipSession[]>({
    queryKey: ["/api/mentorship/sessions"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Calendar className="h-4 w-4 text-blue-400" />;
      case "in_progress":
        return <Play className="h-4 w-4 text-green-400" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const filteredMentors = selectedSpecialization === "all"
    ? mentors
    : Array.isArray(mentors) ? mentors.filter(mentor => mentor.specializations?.includes(selectedSpecialization)) : [];

  const upcomingSessions = Array.isArray(sessions) ? sessions.filter(session => 
    new Date(session.scheduledAt) > new Date() && session.status === "scheduled"
  ) : [];

  const completedSessions = Array.isArray(sessions) ? sessions.filter(session => session.status === "completed") : [];

  const parseTimeSlot = (slotStr: string): TimeSlot | null => {
    // Expected format: "Day HH:mm - HH:mm" or "Day HH:mm-HH:mm"
    // e.g. "Mon 10:00 - 12:00"
    try {
      const parts = slotStr.split(' ');
      const dayStr = parts[0];
      const timeRange = slotStr.substring(dayStr.length).trim();
      const [start, end] = timeRange.split('-').map(t => t.trim());
      
      const days: Record<string, number> = {
        'Sun': 0, 'Sunday': 0,
        'Mon': 1, 'Monday': 1,
        'Tue': 2, 'Tuesday': 2,
        'Wed': 3, 'Wednesday': 3,
        'Thu': 4, 'Thursday': 4,
        'Fri': 5, 'Friday': 5,
        'Sat': 6, 'Saturday': 6
      };
      
      const dayOfWeek = days[dayStr] ?? days[dayStr.substring(0, 3)] ?? 0;
      
      return {
        dayOfWeek,
        startTime: start,
        endTime: end
      };
    } catch (e) {
      return null;
    }
  };

  const mapToComponentProfile = (apiMentor: ApiMentorProfile): ComponentMentorProfile => {
    return {
      id: apiMentor.id,
      userId: apiMentor.userId,
      username: apiMentor.user.firstName ? `${apiMentor.user.firstName} ${apiMentor.user.lastName || ''}`.trim() : apiMentor.user.username,
      bio: apiMentor.bio,
      specializations: apiMentor.specializations,
      experience: apiMentor.experience,
      verificationStatus: apiMentor.verificationStatus as 'pending' | 'verified' | 'rejected',
      credentials: {
        sebiRegistered: apiMentor.credentials?.sebiRegistered,
        certifications: apiMentor.credentials?.certifications || [],
        achievements: apiMentor.credentials?.achievements || [],
        brokerConnections: apiMentor.credentials?.brokerConnections || []
      },
      stats: {
        totalStudents: apiMentor.stats.totalStudents,
        averageRating: apiMentor.stats.rating,
        totalReviews: apiMentor.stats.completedSessions, // Using completed sessions as proxy for reviews count if not available
        successRate: 95, // Mock data or add to API
        totalMentoringHours: apiMentor.stats.completedSessions * 1 // Assuming 1 hr per session
      },
      pricing: {
        hourlyRate: apiMentor.pricing.hourlyRate,
        packageDiscounts: Object.entries(apiMentor.pricing.packageDiscounts || {}).map(([hours, discount]) => ({
          hours: parseInt(hours),
          discount: discount as number
        }))
      },
      availability: {
        timezone: apiMentor.availability.timezone,
        availableSlots: apiMentor.availability.timeSlots
          .map(parseTimeSlot)
          .filter((slot): slot is TimeSlot => slot !== null)
      },
      socialProof: {
        testimonials: (apiMentor.socialProof.testimonials || []).map((t, i) => ({
          id: `t-${i}`,
          studentId: 'unknown',
          studentName: t.studentName,
          content: t.comment,
          rating: t.rating,
          createdAt: new Date(t.date),
          isVerified: true
        })),
        caseStudies: (apiMentor.socialProof.caseStudies || []).map((c, i) => ({
          id: `c-${i}`,
          title: c.title,
          description: c.description,
          challenge: '',
          solution: '',
          results: c.results,
          tags: [],
          createdAt: new Date()
        }))
      }
    };
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-400" />
              Mentorship Hub
            </h1>
            <p className="text-slate-400 mt-2">Connect with expert traders and accelerate your learning journey</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-slate-800/50 p-1 rounded-lg w-fit">
          <Button
            variant={selectedTab === "mentors" ? "default" : "ghost"}
            onClick={() => setSelectedTab("mentors")}
            className={selectedTab === "mentors" ? "bg-blue-600 hover:bg-blue-500" : ""}
          >
            <Users className="h-4 w-4 mr-2" />
            Find Mentors
          </Button>
          <Button
            variant={selectedTab === "sessions" ? "default" : "ghost"}
            onClick={() => setSelectedTab("sessions")}
            className={selectedTab === "sessions" ? "bg-blue-600 hover:bg-blue-500" : ""}
          >
            <Calendar className="h-4 w-4 mr-2" />
            My Sessions
          </Button>
        </div>

        {selectedTab === "mentors" && (
          <>
            {/* Specialization Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Button
                variant={selectedSpecialization === "all" ? "default" : "outline"}
                onClick={() => setSelectedSpecialization("all")}
                className="bg-blue-600 hover:bg-blue-500"
              >
                All Specializations
              </Button>
              <Button
                variant={selectedSpecialization === "day-trading" ? "default" : "outline"}
                onClick={() => setSelectedSpecialization("day-trading")}
              >
                Day Trading
              </Button>
              <Button
                variant={selectedSpecialization === "swing-trading" ? "default" : "outline"}
                onClick={() => setSelectedSpecialization("swing-trading")}
              >
                Swing Trading
              </Button>
              <Button
                variant={selectedSpecialization === "options" ? "default" : "outline"}
                onClick={() => setSelectedSpecialization("options")}
              >
                Options Trading
              </Button>
              <Button
                variant={selectedSpecialization === "futures" ? "default" : "outline"}
                onClick={() => setSelectedSpecialization("futures")}
              >
                Futures Trading
              </Button>
              <Button
                variant={selectedSpecialization === "risk-management" ? "default" : "outline"}
                onClick={() => setSelectedSpecialization("risk-management")}
              >
                Risk Management
              </Button>
            </div>

            {/* Mentors Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentorsLoading ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i} className="glass border-white/10 animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-16 w-16 bg-slate-700 rounded-full mb-4"></div>
                      <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
                      <div className="h-3 w-32 bg-slate-700 rounded mb-4"></div>
                      <div className="h-3 w-full bg-slate-700 rounded mb-2"></div>
                      <div className="h-3 w-3/4 bg-slate-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (filteredMentors?.length || 0) > 0 ? (
                filteredMentors.map((mentor) => (
                  <MentorCard 
                    key={mentor.id} 
                    mentor={mapToComponentProfile(mentor)}
                    onBook={(id) => console.log('Book session with', id)}
                    onViewProfile={(id) => console.log('View profile of', id)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
                  <p className="text-slate-400">Try adjusting your specialization filter.</p>
                </div>
              )}
            </div>
          </>
        )}

        {selectedTab === "sessions" && (
          <div className="space-y-8">
            {/* Upcoming Sessions */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                  Upcoming Sessions ({upcomingSessions?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 bg-slate-800/50 rounded-lg animate-pulse">
                        <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
                        <div className="h-3 w-48 bg-slate-700 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-slate-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (upcomingSessions?.length || 0) > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Video className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{session.title}</h3>
                            <p className="text-sm text-slate-400">
                              with {session.mentor.user.firstName || session.mentor.user.username}
                            </p>
                            <p className="text-sm text-slate-300">{session.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-400">
                            {new Date(session.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-slate-300">
                            {new Date(session.scheduledAt).toLocaleTimeString()}
                          </div>
                          <div className="text-sm text-emerald-400">
                            {session.duration} minutes
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(session.status)}>
                            {getStatusIcon(session.status)}
                            <span className="ml-1 capitalize">{session.status}</span>
                          </Badge>
                          {session.meetingLink && (
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4 mr-2" />
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                    <p className="text-slate-400 mb-4">Book a session with a mentor to get started.</p>
                    <Button onClick={() => setSelectedTab("mentors")}>
                      <Users className="h-4 w-4 mr-2" />
                      Find Mentors
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Sessions */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-emerald-400" />
                  Completed Sessions ({completedSessions?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedSessions && completedSessions.length > 0 ? (
                  <div className="space-y-4">
                    {completedSessions.slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <BookOpen className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{session.title}</h3>
                            <p className="text-sm text-slate-400">
                              with {session.mentor.user.firstName || session.mentor.user.username}
                            </p>
                            {session.feedback && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="text-sm text-slate-300">
                                  {session.feedback.rating}/5
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-400">
                            {new Date(session.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-slate-300">
                            {session.duration} minutes
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(session.status)}>
                            {getStatusIcon(session.status)}
                            <span className="ml-1 capitalize">{session.status}</span>
                          </Badge>
                          {session.recordingUrl && (
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4 mr-2" />
                              Watch
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No completed sessions yet</h3>
                    <p className="text-slate-400">Your completed sessions will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
