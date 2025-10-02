import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, TrendingUp, MessageSquare, Calendar, UserPlus, Send, Eye, CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";

const feedbackSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  tradeId: z.string().optional(),
  type: z.enum(["feedback", "session_notes", "general"]),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required")
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface Student {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  tradingExperience: string | null;
  subscriptionPlan: string;
  createdAt: string;
  stats?: {
    totalTrades: number;
    totalPnL: number;
    winRate: string;
  };
  recentTradeCount?: number;
  lastTradeDate?: string | null;
}

interface CoachStats {
  activeStudents: number;
  avgPerformance: number;
  totalTrades: number;
  sessionsThisWeek: number;
}

interface Feedback {
  id: string;
  studentId: string;
  type: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  student?: {
    firstName: string | null;
    lastName: string | null;
    username: string;
  };
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Redirect if not coach/admin
  if (user && user.role !== 'coach' && user.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
    enabled: user?.role === 'coach' || user?.role === 'admin'
  });

  const { data: recentFeedback = [] } = useQuery<Feedback[]>({
    queryKey: ["/api/admin/feedback"],
    enabled: user?.role === 'coach' || user?.role === 'admin'
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const res = await apiRequest("POST", "/api/admin/feedback", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({ title: "Feedback sent successfully" });
      setIsFeedbackModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send feedback", description: error.message, variant: "destructive" });
    }
  });

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "feedback",
      title: "",
      content: ""
    }
  });

  const onSubmit = (data: FeedbackFormData) => {
    createFeedbackMutation.mutate(data);
  };

  const openFeedbackModal = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
      form.setValue("studentId", student.id);
    }
    setIsFeedbackModalOpen(true);
  };

  // Mock coach stats - in real app, these would come from API
  const coachStats: CoachStats = {
    activeStudents: students.length,
    avgPerformance: 15.3,
    totalTrades: students.reduce((sum, student) => sum + (student.stats?.totalTrades || 0), 0),
    sessionsThisWeek: 18
  };

  const getStatusColor = (stats?: Student['stats']) => {
    if (!stats || stats.totalTrades === 0) return 'bg-slate-500/20 text-slate-400';
    const winRate = parseFloat(stats.winRate);
    const pnl = stats.totalPnL;
    
    if (winRate >= 60 && pnl > 0) return 'bg-emerald-500/20 text-emerald-400';
    if (winRate >= 40 || pnl > 0) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getStatusText = (stats?: Student['stats']) => {
    if (!stats || stats.totalTrades === 0) return 'New';
    const winRate = parseFloat(stats.winRate);
    const pnl = stats.totalPnL;
    
    if (winRate >= 60 && pnl > 0) return 'Excellent';
    if (winRate >= 40 || pnl > 0) return 'Good';
    return 'Needs Help';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Coach Dashboard</h1>
            <p className="text-slate-400">Manage your students and provide guidance</p>
          </div>
          <div className="flex space-x-4">
            <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-500">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Feedback
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] glass border-white/10">
                <DialogHeader>
                  <DialogTitle>Send Feedback to Student</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="studentId">Student</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("studentId", value)}
                      value={form.watch("studentId")}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 mt-2">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName && student.lastName 
                              ? `${student.firstName} ${student.lastName}`
                              : student.username
                            } ({student.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("type", value as "feedback" | "session_notes" | "general")}
                      defaultValue="feedback"
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="session_notes">Session Notes</SelectItem>
                        <SelectItem value="general">General Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      className="bg-slate-800 border-slate-600 mt-2"
                      placeholder="Enter feedback title"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-400 mt-1">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      {...form.register("content")}
                      className="bg-slate-800 border-slate-600 mt-2"
                      placeholder="Enter your feedback, suggestions, or session notes..."
                      rows={6}
                    />
                    {form.formState.errors.content && (
                      <p className="text-sm text-red-400 mt-1">{form.formState.errors.content.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsFeedbackModalOpen(false);
                        setSelectedStudent(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-500"
                      disabled={createFeedbackMutation.isPending}
                    >
                      {createFeedbackMutation.isPending ? "Sending..." : "Send Feedback"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Students</p>
                  <p className="text-2xl font-bold text-blue-400">{coachStats.activeStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Performance</p>
                  <p className="text-2xl font-bold text-emerald-400">+{coachStats.avgPerformance}%</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Trades</p>
                  <p className="text-2xl font-bold">{coachStats.totalTrades.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Sessions This Week</p>
                  <p className="text-2xl font-bold text-yellow-400">{coachStats.sessionsThisWeek}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student List */}
        <Card className="glass border-white/10 mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Student Overview</CardTitle>
              <div className="flex space-x-2">
                <Select>
                  <SelectTrigger className="bg-slate-800 border-slate-600 w-40">
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="needs-attention">Needs Attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400">Student</th>
                      <th className="text-left py-3 px-4 text-slate-400">Performance</th>
                      <th className="text-left py-3 px-4 text-slate-400">Trades</th>
                      <th className="text-left py-3 px-4 text-slate-400">Win Rate</th>
                      <th className="text-left py-3 px-4 text-slate-400">Last Activity</th>
                      <th className="text-left py-3 px-4 text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold">
                                {student.firstName && student.lastName
                                  ? `${student.firstName[0]}${student.lastName[0]}`
                                  : student.username.slice(0, 2).toUpperCase()
                                }
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold">
                                {student.firstName && student.lastName
                                  ? `${student.firstName} ${student.lastName}`
                                  : student.username
                                }
                              </p>
                              <p className="text-slate-400 text-sm">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={student.stats && student.stats.totalPnL >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                            {student.stats 
                              ? `${student.stats.totalPnL >= 0 ? '+' : ''}$${student.stats.totalPnL.toLocaleString()}`
                              : '$0'
                            }
                          </span>
                        </td>
                        <td className="py-3 px-4">{student.stats?.totalTrades || 0}</td>
                        <td className="py-3 px-4">{student.stats?.winRate || '0.0'}%</td>
                        <td className="py-3 px-4 text-slate-400">
                          {student.lastTradeDate 
                            ? new Date(student.lastTradeDate).toLocaleDateString()
                            : 'No trades'
                          }
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(student.stats)}>
                            {getStatusText(student.stats)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openFeedbackModal(student)}
                              className="text-purple-400 hover:text-purple-300"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-yellow-400 hover:text-yellow-300"
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No students assigned</h3>
                <p className="text-slate-400 mb-6">Students will appear here once they're assigned to you</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle>Recent Feedback & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentFeedback.length > 0 ? (
              <div className="space-y-4">
                {recentFeedback.slice(0, 5).map((feedback) => (
                  <div key={feedback.id} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {feedback.student?.firstName && feedback.student?.lastName
                            ? `${feedback.student.firstName} ${feedback.student.lastName}`
                            : feedback.student?.username || 'Unknown Student'
                          }
                        </span>
                        <span className="text-slate-400 text-sm">
                          • {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          feedback.type === 'feedback' 
                            ? 'border-emerald-500/30 text-emerald-400'
                            : feedback.type === 'session_notes'
                            ? 'border-blue-500/30 text-blue-400'
                            : 'border-purple-500/30 text-purple-400'
                        }
                      >
                        {feedback.type === 'feedback' ? 'Feedback' : 
                         feedback.type === 'session_notes' ? 'Session Notes' : 'General'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-1">{feedback.title}</h4>
                    <p className="text-slate-300">{feedback.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <p className="text-slate-400">No feedback sent yet. Start coaching your students!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
