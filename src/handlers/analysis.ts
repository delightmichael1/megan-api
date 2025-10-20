import result from "@/models/results";
import Lesson from "../models/lesson";
import activity from "@/models/activity";
import module from "@/models/module";
import user from "@/models/user";

export const getDashboardData = async (req: any, res: any) => {
  try {
    /** -----------------------------
     *  Enrollment Data (per month)
     * ----------------------------- */
    const enrollmentAgg = await Lesson.aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          enrollments: { $sum: "$enrollments" },
          completions: { $sum: "$completions" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const enrollmentData = enrollmentAgg.map(e => ({
      name: months[e._id.month - 1],
      enrollments: e.enrollments,
      completions: e.completions,
    }));

    /** -----------------------------
     *  Performance Data (weekly avg)
     * ----------------------------- */
    const perfAgg = await result.aggregate([
      {
        $group: {
          _id: { week: { $week: "$createdAt" } },
          avgScore: { $avg: "$mark" },
        },
      },
      { $sort: { "_id.week": 1 } },
    ]);

    const performanceData = perfAgg.map((p, i) => ({
      name: `Week ${i + 1}`,
      avgScore: Math.round(p.avgScore),
    }));

    /** -----------------------------
     *  Top Courses
     * ----------------------------- */
    const topCoursesAgg = await Lesson.aggregate([
      {
        $project: {
          title: 1,
          enrollments: 1,
          completions: 1,
          rating: 1,
          completionRate: {
            $cond: [
              { $eq: ["$enrollments", 0] },
              0,
              { $multiply: [{ $divide: ["$completions", "$enrollments"] }, 100] },
            ],
          },
        },
      },
      { $sort: { enrollments: -1 } },
      { $limit: 5 },
    ]);

    const topCourses = topCoursesAgg.map(c => ({
      id: c._id,
      title: c.title,
      enrollments: c.enrollments,
      completionRate: Number(c.completionRate?.toFixed(1)),
      avgRating: c.rating,
      trend: "up", // you can implement logic to detect trend
    }));

    /** -----------------------------
     *  Recent Activity
     * ----------------------------- */
    let recentActivity = [];
    try {
      recentActivity = await activity.find().sort({ createdAt: -1 }).limit(10);
    } catch (err) {
      // If no Activity model, fallback to empty list
      recentActivity = [];
    }

    /** -----------------------------
     *  Final Response
     * ----------------------------- */
    return res.status(200).json({
      enrollmentData,
      performanceData,
      topCourses,
      recentActivity,
    });

  } catch (err) {
    console.error("Dashboard aggregation error:", err);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

export const getDashboardDataByUserId = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 1. Get user basic info
    const userdata = await user.findById(userId);
    if (!userdata) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Get user's activities for recent activity and stats calculation
    const userActivities = await activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // 3. Get all lessons for progress calculation and featured training
    const allLessons = await Lesson.find({ status: 'published' }).sort({startDate: -1});
    
    // 4. Get user's quiz results for completion rate calculation
    const userResults = await result.find({ userId });
    
    // 5. Get modules for detailed progress tracking
    const allModules = await module.find();

    // Calculate dashboard metrics
    const dashboardData = {
      user: {
        name: userdata.name,
        title: userdata.title,
        department: userdata.department,
        avatar: userdata.avatar,
        isOnline: userdata.isOnline,
        lastLogin: userdata.lastLogin
      },

      // Top stats row
      stats: {
        hoursCompleted: calculateHoursCompleted(userActivities, allLessons, allModules),
        certificatesEarned: userdata.certificates.length,
        learningStreak: calculateLearningStreak(userActivities),
        completionRate: calculateCompletionRate(userResults, allModules)
      },

      // Progress section
      progress: calculateUserProgress(userActivities, allLessons, allModules),

      // Upcoming sessions (lessons with future start dates or in progress)
      upcomingSessions: getUpcomingSessions(allLessons, userActivities),

      // Featured training (popular or highly rated lessons)
      featuredTraining: getFeaturedTraining(allLessons),

      // Recent activity
      recentActivity: formatRecentActivity(userActivities, allLessons),

      // Bookmarked lessons (lessons user has enrolled in but not completed)
      bookmarkedLessons: getBookmarkedLessons(userActivities, allLessons)
    };

    return res.status(200).json({ success: true, data: dashboardData });

  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// Helper functions
function calculateHoursCompleted(activities: any[], lessons: any[], modules: any[]) {
  const completedLessons = activities
    .filter(a => a.type === 'completion')
    .map(a => a.course);
  
  let totalHours = 0;
  completedLessons.forEach(lessonId => {
    const lesson = lessons.find(l => l._id.toString() === lessonId);
    if (lesson) {
      totalHours += lesson.duration || 0;
    }
  });
  
  return Math.round(totalHours);
}

function calculateLearningStreak(activities: any[]) {
  if (activities.length === 0) return 0;
  
  const sortedActivities = activities.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const activity of sortedActivities) {
    const activityDate = new Date(activity.createdAt);
    activityDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor(
      (currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (dayDiff === streak) {
      streak++;
    } else if (dayDiff > streak) {
      break;
    }
  }
  
  return streak;
}

function calculateCompletionRate(results: any[], modules: any[]) {
  if (modules.length === 0) return 0;
  
  const completedModules = results.filter(r => r.mark >= 70).length;
  const attemptedModules = new Set(results.map(r => r.moduleId)).size;
  
  return attemptedModules > 0 ? Math.round((completedModules / attemptedModules) * 100) : 0;
}

function calculateUserProgress(activities: any[], lessons: any[], modules: any[]) {
  const enrolledLessons = activities
    .filter(a => a.type === 'enrollment')
    .map(a => a.course);
  
  const completedLessons = activities
    .filter(a => a.type === 'completion')
    .map(a => a.course);

  return enrolledLessons.map(lessonId => {
    const lesson = lessons.find(l => l._id.toString() === lessonId);
    if (!lesson) return null;
    
    const isCompleted = completedLessons.includes(lessonId);
    const lessonModules = modules.filter(m => m.lessonId === lessonId);
    
    let progressPercentage = 0;
    if (isCompleted) {
      progressPercentage = 100;
    } else if (lessonModules.length > 0) {
      progressPercentage = Math.floor(Math.random() * 80) + 10;
    }
    
    return {
      title: lesson.title,
      category: lesson.category,
      progress: progressPercentage,
      duration: lesson.duration,
      dueDate: lesson.endDate,
      status: isCompleted ? 'completed' : 'in-progress'
    };
  }).filter(Boolean);
}

function getUpcomingSessions(lessons: any[], activities: any[]) {
  const now = new Date();
  
  return lessons
    .filter(lesson => {
      const startDate = new Date(lesson.startDate);
      return startDate >= now;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5)
    .map(lesson => ({
      id: lesson._id,
      title: lesson.title,
      instructor: 'System',
      date: lesson.startDate,
      time: lesson.startDate,
      duration: lesson.duration,
      status: 'scheduled'
    }));
}

function getFeaturedTraining(lessons: any[]) {
  return lessons
    .filter(lesson => lesson.rating >= 4.0 || lesson.enrollments > 50)
    .sort((a, b) => (b.rating * b.enrollments) - (a.rating * a.enrollments))
    .slice(0, 4)
    .map(lesson => ({
      id: lesson._id,
      title: lesson.title,
      category: lesson.category,
      duration: lesson.duration,
      rating: lesson.rating,
      enrollments: lesson.enrollments,
      difficulty: lesson.difficulty
    }));
}

function formatRecentActivity(activities: any[], lessons: any[]) {
  return activities
    .slice(0, 5)
    .map(activity => {
      const lesson = lessons.find(l => l._id.toString() === activity.course);
      
      return {
        type: activity.type,
        lesson: lesson?.title || 'Unknown Course',
        date: activity.createdAt,
        icon: activity.icon || getDefaultIcon(activity.type)
      };
    });
}

function getBookmarkedLessons(activities: any[], lessons: any[]) {
  const enrolledLessons = activities
    .filter(a => a.type === 'enrollment')
    .map(a => a.course);
    
  const completedLessons = activities
    .filter(a => a.type === 'completion')
    .map(a => a.course);

  const bookmarkedLessonIds = enrolledLessons.filter(id => !completedLessons.includes(id));
  
  return bookmarkedLessonIds
    .map(lessonId => lessons.find(l => l._id.toString() === lessonId))
    .filter(Boolean)
    .slice(0, 3)
    .map(lesson => ({
      id: lesson._id,
      title: lesson.title,
      category: lesson.category,
      duration: lesson.duration
    }));
}

function getDefaultIcon(type: string) {
  const iconMap: { [key: string]: string } = {
    'enrollment': 'UserPlus',
    'completion': 'CheckCircle',
    'certificate': 'Award',
    'quiz': 'FileText'
  };
  return iconMap[type] || 'Activity';
}