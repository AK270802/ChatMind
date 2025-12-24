import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassBadge } from '@/components/ui/glassmorphism';
import { Star, Clock, Users, Award, MessageSquare, Calendar, CheckCircle } from 'lucide-react';

interface MentorProfile {
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
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

interface Testimonial {
  id: string;
  studentId: string;
  studentName: string;
  content: string;
  rating: number;
  createdAt: Date;
  isVerified: boolean;
}

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  tags: string[];
  createdAt: Date;
}

interface MentorCardProps {
  mentor: MentorProfile;
  onBook?: (mentorId: string) => void;
  onViewProfile?: (mentorId: string) => void;
  className?: string;
}

const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  onBook,
  onViewProfile,
  className = ''
}) => {
  const [showFullBio, setShowFullBio] = useState(false);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getVerificationColor = (status: MentorProfile['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return 'text-green-400 border-green-400/30';
      case 'pending':
        return 'text-yellow-400 border-yellow-400/30';
      case 'rejected':
        return 'text-red-400 border-red-400/30';
      default:
        return 'text-gray-400 border-gray-400/30';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
      />
    ));
  };

  const truncateBio = (bio: string, maxLength: number = 100) => {
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength) + '...';
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
            {mentor.username.charAt(0).toUpperCase()}
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-bold text-white">{mentor.username}</h3>
              <GlassBadge 
                variant="outline" 
                size="sm" 
                color={mentor.verificationStatus === 'verified' ? 'green' : mentor.verificationStatus === 'pending' ? 'yellow' : 'red'}
              >
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{mentor.verificationStatus.toUpperCase()}</span>
                </div>
              </GlassBadge>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-white/60">
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span>{mentor.experience} years</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{mentor.stats.averageRating.toFixed(1)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{mentor.stats.totalStudents} students</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEBI Registration */}
        {mentor.credentials.sebiRegistered && (
          <GlassBadge variant="solid" size="sm" color="blue">
            SEBI Registered
          </GlassBadge>
        )}
      </div>

      {/* Bio */}
      <div className="mb-4">
        <p className="text-white/80 text-sm leading-relaxed">
          {showFullBio ? mentor.bio : truncateBio(mentor.bio)}
        </p>
        {mentor.bio.length > 100 && (
          <button
            onClick={() => setShowFullBio(!showFullBio)}
            className="text-blue-400 text-sm hover:text-blue-300 mt-1"
          >
            {showFullBio ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Specializations */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-2">Specializations</h4>
        <div className="flex flex-wrap gap-2">
          {mentor.specializations.map((spec, index) => (
            <GlassBadge key={index} variant="subtle" size="sm" color="purple">
              {spec}
            </GlassBadge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-lg font-bold text-green-400">{mentor.stats.successRate}%</div>
          <div className="text-xs text-white/60">Success Rate</div>
        </div>
        
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-lg font-bold text-blue-400">{mentor.stats.totalReviews}</div>
          <div className="text-xs text-white/60">Reviews</div>
        </div>
        
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-lg font-bold text-purple-400">{mentor.stats.totalMentoringHours}h</div>
          <div className="text-xs text-white/60">Mentoring</div>
        </div>
        
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-lg font-bold text-yellow-400">{formatCurrency(mentor.pricing.hourlyRate)}</div>
          <div className="text-xs text-white/60">Per Hour</div>
        </div>
      </div>

      {/* Availability */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>Available Slots</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {mentor.availability.availableSlots.slice(0, 3).map((slot, index) => (
            <GlassBadge key={index} variant="outline" size="sm" color="green">
              {getDayName(slot.dayOfWeek)} {slot.startTime}-{slot.endTime}
            </GlassBadge>
          ))}
          {mentor.availability.availableSlots.length > 3 && (
            <GlassBadge variant="subtle" size="sm" color="gray">
              +{mentor.availability.availableSlots.length - 3} more
            </GlassBadge>
          )}
        </div>
      </div>

      {/* Recent Testimonial */}
      {mentor.socialProof.testimonials.length > 0 && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Recent Review</span>
          </div>
          <p className="text-sm text-white/70 italic">
            "{mentor.socialProof.testimonials[0].content}"
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex items-center space-x-1">
              {getRatingStars(mentor.socialProof.testimonials[0].rating)}
            </div>
            <span className="text-xs text-white/60">
              - {mentor.socialProof.testimonials[0].studentName}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
        <GlassButton
          variant="default"
          size="sm"
          onClick={() => onBook?.(mentor.id)}
          className="flex-1"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book Session
        </GlassButton>
        
        <GlassButton
          variant="outline"
          size="sm"
          onClick={() => onViewProfile?.(mentor.id)}
        >
          View Profile
        </GlassButton>
      </div>
    </GlassCard>
  );
};

export default MentorCard;
export type { MentorProfile, Testimonial, CaseStudy, MentorCardProps };
