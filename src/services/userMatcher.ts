import user from "@/models/user";

export interface Weights {
  mentorshipCompatibility: number;
  skillsMatch: number;
  industryMatch: number;
  locationProximity: number;
  ratingScore: number;
  activityScore: number;
  onlineStatus: number;
}

/**
 * Advanced User Matching Algorithm
 * Scores users based on multiple compatibility factors
 */
class UserMatcher {
    private weights: Weights;
  constructor() {
    // Weight configuration for different matching factors
    this.weights = {
      mentorshipCompatibility: 0.25,    // 25% - Most important
      skillsMatch: 0.20,                // 20% - Very important
      industryMatch: 0.15,              // 15% - Important
      locationProximity: 0.15,          // 15% - Important for networking
      ratingScore: 0.10,                // 10% - Quality indicator
      activityScore: 0.10,              // 10% - Engagement level
      onlineStatus: 0.05                // 5% - Immediate availability
    };
  }

  /**
   * Main function to find matching users
   * @param {String} userId - Current user's ID
   * @param {Object} options - Filtering and pagination options
   * @returns {Array} Array of matched users with scores
   */
  async findMatches(userId: string, options: any = {}): Promise<any[]> {
    const {
      limit = 20,
      skip = 0,
      minScore = 0.3,
      mentorshipType = null,
      industry = null,
      location = null,
      onlineOnly = false
    } = options;

    try {
      // Get current user data
      const currentUser = await user.findById(userId).lean();
      if (!currentUser) {
        throw new Error('Current user not found');
      }

      // Build query filters
      const matchQuery = {
        _id: { $ne: userId }, // Exclude current user
        ...(mentorshipType && { mentorshipType }),
        ...(industry && { industry }),
        ...(location && { location }),
        ...(onlineOnly && { isOnline: true })
      };

      // Fetch potential matches
      const potentialMatches = await user.find(matchQuery).lean();

      // Calculate scores for each user
      const scoredUsers = potentialMatches.map(user => ({
        ...user,
        matchScore: this.calculateMatchScore(currentUser, user),
        matchFactors: this.getMatchFactors(currentUser, user)
      }));

      // Filter by minimum score and sort by score descending
      const filteredUsers = scoredUsers
        .filter(user => user.matchScore >= minScore)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(skip, skip + limit);

      return filteredUsers;
    } catch (error) {
      console.error('Error in findMatches:', error);
      throw error;
    }
  }

  /**
   * Calculate overall match score between two users
   * @param {Object} currentUser - Current user object
   * @param {Object} targetUser - Target user to match against
   * @returns {Number} Match score between 0 and 1
   */
  calculateMatchScore(currentUser: object, targetUser: object): number {
    const scores = {
      mentorshipCompatibility: this.calculateMentorshipCompatibility(currentUser, targetUser),
      skillsMatch: this.calculateSkillsMatch(currentUser, targetUser),
      industryMatch: this.calculateIndustryMatch(currentUser, targetUser),
      locationProximity: this.calculateLocationProximity(currentUser, targetUser),
      ratingScore: this.calculateRatingScore(targetUser),
      activityScore: this.calculateActivityScore(targetUser),
      onlineStatus: this.calculateOnlineStatus(targetUser)
    };

    // Calculate weighted total score
    let totalScore = 0;
    for (const [factor, score] of Object.entries(scores)) {
      totalScore += score * this.weights[factor];
    }

    return Math.round(totalScore * 1000) / 1000; // Round to 3 decimal places
  }

  /**
   * Calculate mentorship compatibility score
   * @param {Object} currentUser
   * @param {Object} targetUser
   * @returns {Number} Score between 0 and 1
   */
  calculateMentorshipCompatibility(currentUser: any, targetUser: any): number {
    const currentType = currentUser.mentorshipType;
    const targetType = targetUser.mentorshipType;

    // Perfect matches
    if (currentType === 'mentor' && targetType === 'mentee') return 1.0;
    if (currentType === 'mentee' && targetType === 'mentor') return 1.0;
    
    // Both flexible (both type)
    if (currentType === 'both' && targetType === 'both') return 0.9;
    
    // One flexible, one specific
    if (currentType === 'both' || targetType === 'both') return 0.8;
    
    // Same type (networking potential)
    if (currentType === targetType) return 0.6;
    
    // No mentorship type specified
    if (!currentType || !targetType) return 0.4;
    
    return 0.2;
  }

  /**
   * Calculate skills compatibility score
   * @param {Object} currentUser
   * @param {Object} targetUser
   * @returns {Number} Score between 0 and 1
   */
  calculateSkillsMatch(currentUser: any, targetUser: any): number {
    const currentSkills = currentUser.skills || [];
    const targetSkills = targetUser.skills || [];

    if (currentSkills.length === 0 || targetSkills.length === 0) {
      return 0.3; // Default score when skills data is missing
    }

    // Convert to lowercase for case-insensitive matching
    const currentSkillsLower = currentSkills.map((skill: string) => skill.toLowerCase());
    const targetSkillsLower = targetSkills.map((skill: string) => skill.toLowerCase());

    // Calculate intersection and union
    const intersection = currentSkillsLower.filter((skill: any) => 
      targetSkillsLower.includes(skill)
    );
    const union = [...new Set([...currentSkillsLower, ...targetSkillsLower])];

    // Jaccard similarity coefficient
    const jaccardScore = intersection.length / union.length;

    // Bonus for complementary skills (different skills that could be valuable for learning)
    const complementarySkills = targetSkillsLower.filter((skill: any) => 
      !currentSkillsLower.includes(skill)
    );
    const complementaryBonus = Math.min(complementarySkills.length / 10, 0.2);

    return Math.min(jaccardScore + complementaryBonus, 1.0);
  }

  /**
   * Calculate industry match score
   * @param {Object} currentUser
   * @param {Object} targetUser
   * @returns {Number} Score between 0 and 1
   */
  calculateIndustryMatch(currentUser: any, targetUser: any): number {
    if (!currentUser.industry || !targetUser.industry) {
      return 0.5; // Neutral score when industry data is missing
    }

    // Exact match
    if (currentUser.industry.toLowerCase() === targetUser.industry.toLowerCase()) {
      return 1.0;
    }

    // Related industries (you can expand this with industry mappings)
    const relatedIndustries = this.getRelatedIndustries(currentUser.industry);
    if (relatedIndustries.includes(targetUser.industry.toLowerCase())) {
      return 0.7;
    }

    return 0.3; // Different industries still have networking value
  }

  /**
   * Calculate location proximity score
   * @param {Object} currentUser
   * @param {Object} targetUser
   * @returns {Number} Score between 0 and 1
   */
  calculateLocationProximity(currentUser: any, targetUser: any): number {
    if (!currentUser.location || !targetUser.location) {
      return 0.6; // Neutral score for missing location data
    }

    const currentLocation = currentUser.location.toLowerCase();
    const targetLocation = targetUser.location.toLowerCase();

    // Exact match (same city/location)
    if (currentLocation === targetLocation) {
      return 1.0;
    }

    // Same region/state (basic string matching - you can improve this with geolocation)
    if (this.isSameRegion(currentLocation, targetLocation)) {
      return 0.8;
    }

    // Same country (basic check)
    if (this.isSameCountry(currentLocation, targetLocation)) {
      return 0.6;
    }

    return 0.4; // Different countries still have value for global networking
  }

  /**
   * Calculate rating-based score
   * @param {Object} targetUser
   * @returns {Number} Score between 0 and 1
   */
  calculateRatingScore(targetUser: any): number {
    const rating = targetUser.rating || 0;
    return rating / 5; // Normalize rating to 0-1 scale
  }

  /**
   * Calculate activity score based on connections and posts
   * @param {Object} targetUser
   * @returns {Number} Score between 0 and 1
   */
  calculateActivityScore(targetUser: any): number {
    const connections = targetUser.connections || 0;
    const posts = targetUser.posts || 0;

    // Normalize connections (assuming 100+ connections is very active)
    const connectionScore = Math.min(connections / 100, 1);
    
    // Normalize posts (assuming 50+ posts is very active)
    const postScore = Math.min(posts / 50, 1);

    // Weighted average (connections weighted more heavily)
    return (connectionScore * 0.7) + (postScore * 0.3);
  }

  /**
   * Calculate online status score
   * @param {Object} targetUser
   * @returns {Number} Score between 0 and 1
   */
  calculateOnlineStatus(targetUser: any): number {
    return targetUser.isOnline ? 1.0 : 0.3;
  }

  /**
   * Get detailed match factors for explanation
   * @param {Object} currentUser
   * @param {Object} targetUser
   * @returns {Object} Breakdown of match factors
   */
  getMatchFactors(currentUser: any, targetUser: any): any {
    return {
      mentorshipCompatibility: this.calculateMentorshipCompatibility(currentUser, targetUser),
      skillsMatch: this.calculateSkillsMatch(currentUser, targetUser),
      industryMatch: this.calculateIndustryMatch(currentUser, targetUser),
      locationProximity: this.calculateLocationProximity(currentUser, targetUser),
      ratingScore: this.calculateRatingScore(targetUser),
      activityScore: this.calculateActivityScore(targetUser),
      onlineStatus: this.calculateOnlineStatus(targetUser)
    };
  }

  /**
   * Get related industries (expand this based on your domain knowledge)
   * @param {String} industry
   * @returns {Array} Array of related industries
   */
  getRelatedIndustries(industry: string): Array<any> {
    const industryMap = {
      'technology': ['software', 'it', 'fintech', 'saas', 'artificial intelligence'],
      'finance': ['banking', 'fintech', 'investment', 'insurance'],
      'healthcare': ['medical', 'pharmaceuticals', 'biotechnology', 'wellness'],
      'education': ['edtech', 'training', 'e-learning', 'academic'],
      'marketing': ['advertising', 'digital marketing', 'content', 'social media'],
      // Add more industry relationships as needed
    };

    return industryMap[industry.toLowerCase()] || [];
  }

  /**
   * Check if two locations are in the same region (basic implementation)
   * @param {String} loc1
   * @param {String} loc2
   * @returns {Boolean}
   */
  isSameRegion(loc1: string, loc2: string): boolean {
    // This is a simplified implementation
    // You should use proper geolocation services for production
    const commonWords = ['state', 'province', 'region'];
    
    for (const word of commonWords) {
      if (loc1.includes(word) && loc2.includes(word)) {
        const region1 = loc1.split(',')[1]?.trim();
        const region2 = loc2.split(',')[1]?.trim();
        return region1 === region2;
      }
    }
    return false;
  }

  /**
   * Check if two locations are in the same country (basic implementation)
   * @param {String} loc1
   * @param {String} loc2
   * @returns {Boolean}
   */
  isSameCountry(loc1: string, loc2: string): boolean {
    // This is a simplified implementation
    // You should use proper geolocation services for production
    const country1 = loc1.split(',').pop()?.trim();
    const country2 = loc2.split(',').pop()?.trim();
    return country1 === country2;
  }
}

export async function findUserMatches(userId: string, options = {}) {
  const matcher = new UserMatcher();
  return await matcher.findMatches(userId, options);
}

export async function findMentors(userId: string, options = {}) {
  const matcher = new UserMatcher();
  return await matcher.findMatches(userId, {
    ...options,
    mentorshipType: 'mentor'
  });
}

export async function findMentees(userId: string, options = {}) {
  const matcher = new UserMatcher();
  return await matcher.findMatches(userId, {
    ...options,
    mentorshipType: 'mentee'
  });
}

export async function findIndustryPeers(userId: string, industry: any, options = {}) {
  const matcher = new UserMatcher();
  return await matcher.findMatches(userId, {
    ...options,
    industry,
    minScore: 0.6
  });
}

export default UserMatcher;