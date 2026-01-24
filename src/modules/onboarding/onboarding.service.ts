import { generateJSON } from '@/lib/anthropic';
import {
  generateGoalResponseSchema,
  type GenerateGoalRequest,
  type GenerateGoalResponse,
} from './onboarding.schemas';

class OnboardingService {
  async generateGoal(input: GenerateGoalRequest): Promise<GenerateGoalResponse> {
    try {
      return await generateJSON<GenerateGoalResponse>(
        this.getSystemPrompt(),
        this.buildPrompt(input),
        (text) => {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON found in response');
          return generateGoalResponseSchema.parse(JSON.parse(jsonMatch[0]));
        }
      );
    } catch (error) {
      console.error('[OnboardingService] LLM error, using fallback:', error);
      return this.fallbackGoal(input);
    }
  }

  private getSystemPrompt(): string {
    return `You are a fitness coach for a screen-time management app. Generate personalized daily fitness goals.
Always respond with valid JSON only, no markdown or explanation.`;
  }

  private buildPrompt(input: GenerateGoalRequest): string {
    const {
      ageRange,
      gender,
      heightRange,
      fitnessLevel,
      activityType,
      behaviorScore,
      behaviorBreakdown,
      healthBaseline,
    } = input;

    return `Generate a personalized ${activityType} goal for this user:

USER PROFILE:
- Age: ${ageRange}
- Gender: ${gender}
- Height: ${heightRange}
- Fitness level: ${fitnessLevel}
- Activity: ${activityType}

BEHAVIOR ASSESSMENT (0-12, higher = more screen dependent):
- Total: ${behaviorScore}/12
- Opens apps unconsciously: ${behaviorBreakdown.unconsciousUsage}/3
- Chooses screen over exercise: ${behaviorBreakdown.timeDisplacement}/3
- Gets distracted at work: ${behaviorBreakdown.productivityImpact}/3
- Failed to reduce screen time: ${behaviorBreakdown.failedRegulation}/3

${
  healthBaseline
    ? `HEALTH DATA (14 days):
- Avg daily steps: ${healthBaseline.avgDailySteps}
- Avg daily distance: ${healthBaseline.avgDailyDistanceKm} km
- Workouts: ${healthBaseline.totalWorkouts}
- Has runs: ${healthBaseline.hasRunningWorkouts}`
    : 'HEALTH DATA: Not available'
}

RULES:
1. Distance: 10-20% above baseline if available, else use fitness norms
2. Fitness norms (km): sedentary 1-1.5, light 1.5-2.5, moderate 2.5-4, active 4-6
3. For runs: multiply walking distance by 1.3
4. High behavior score (8+): use lower end of range
5. Age 55+: reduce by 20%
6. Height under-150: reduce by 10%
7. Reward: 15 min/km walking, 22 min/km running

PROFILE TYPES:
- "rebuilder": sedentary/light + behavior 6-12
- "starter": sedentary/light + behavior 0-5
- "optimizer": moderate/active

RESPOND WITH JSON ONLY:
{
  "suggestedDistanceKm": <number>,
  "suggestedRewardMinutes": <integer>,
  "reasoning": "<1-2 sentences>",
  "profileType": "<rebuilder|starter|optimizer>",
  "profileTitle": "<2-3 word title>",
  "profileInsight": "<1-2 encouraging sentences>",
  "successProbability": <75-95>,
  "projectedGain": "<string like +150% in 30 days>"
}`;
  }

  private fallbackGoal(input: GenerateGoalRequest): GenerateGoalResponse {
    const { activityType, fitnessLevel, ageRange, heightRange, behaviorScore } = input;

    const baseDistances: Record<string, Record<string, number>> = {
      walk: { sedentary: 1.0, light: 1.5, moderate: 2.5, active: 3.5 },
      run: { sedentary: 1.5, light: 2.0, moderate: 3.0, active: 5.0 },
    };

    let distance = baseDistances[activityType][fitnessLevel];

    // Adjustments
    if (ageRange === '55+') distance *= 0.8;
    if (heightRange === 'under-150') distance *= 0.9;
    if (behaviorScore >= 8) distance *= 0.85;

    distance = Math.round(distance * 10) / 10;

    const rewardRate = activityType === 'run' ? 22 : 15;
    const rewardMinutes = Math.round(distance * rewardRate);

    // Profile assignment
    const isLowFitness = fitnessLevel === 'sedentary' || fitnessLevel === 'light';
    const profileType = isLowFitness
      ? behaviorScore >= 6
        ? 'rebuilder'
        : 'starter'
      : 'optimizer';

    const profileTitles: Record<string, string> = {
      rebuilder: 'The Momentum Rebuilder',
      starter: 'The Fresh Starter',
      optimizer: 'The Active Optimizer',
    };

    const profileInsights: Record<string, string> = {
      rebuilder:
        'You have the drive but lacked a system that rewards consistency. This changes now.',
      starter:
        'A clean slate is powerful. Building habits from scratch means no bad patterns to unlearn.',
      optimizer:
        'You already move regularly. Adding structure will amplify your existing discipline.',
    };

    return {
      suggestedDistanceKm: distance,
      suggestedRewardMinutes: rewardMinutes,
      reasoning: `Based on your ${fitnessLevel} fitness level and ${activityType} preference.`,
      profileType: profileType as 'rebuilder' | 'starter' | 'optimizer',
      profileTitle: profileTitles[profileType],
      profileInsight: profileInsights[profileType],
      successProbability: 85,
      projectedGain: '+120% activity in 30 days',
    };
  }
}

export const onboardingService = new OnboardingService();
