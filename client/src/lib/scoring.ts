import { scoringComponents, gradeScales } from "@shared/schema";
import { LoanApplication } from "@/types/loan";

/**
 * Calculate a component score based on provided value and maximum weight
 * @param value The value to calculate score for
 * @param maxWeight The maximum weight of the component
 * @param scoreRange The range to map the value to (default 0-100)
 */
export function calculateComponentScore(value: number, maxWeight: number, scoreRange = 100) {
  // Map the value to a score within the component's weight
  return Math.min(Math.round((value / scoreRange) * maxWeight), maxWeight);
}

/**
 * Determine the grade based on the numerical score
 * @param score The numerical score (0-100)
 */
export function determineGrade(score: number) {
  for (const scale of gradeScales) {
    if (score >= scale.minScore && score <= scale.maxScore) {
      return scale;
    }
  }
  return gradeScales[gradeScales.length - 1]; // Default to lowest grade
}

/**
 * Get the grade description
 * @param grade The letter grade (e.g., 'A+', 'B-', etc.)
 */
export function getGradeDescription(grade: string) {
  const gradeInfo = gradeScales.find(g => g.grade === grade);
  return gradeInfo ? gradeInfo.description : "Grade information not available";
}

/**
 * Calculate the total score from all scoring components
 * @param componentScores Object containing scores for each component
 */
export function calculateTotalScore(componentScores: Record<string, number>) {
  return Object.entries(componentScores).reduce((total, [key, score]) => {
    // Find the component to get its weight
    const component = scoringComponents.find(c => c.key === key);
    if (!component) return total;
    // Add the score to the total
    return total + score;
  }, 0);
}

/**
 * Get the color class for a grade
 * @param grade The letter grade
 */
export function getGradeColorClass(grade: string) {
  const firstChar = grade.charAt(0);
  if (firstChar === 'A') return 'bg-success-50 text-success-700';
  if (firstChar === 'B') return 'bg-warning-50 text-warning-700';
  return 'bg-danger-50 text-danger-700';
}

/**
 * Get the color for a component score based on percentage
 * @param score The score value
 * @param maxWeight The maximum possible score
 */
export function getComponentScoreColor(score: number, maxWeight: number) {
  const percentage = (score / maxWeight) * 100;
  if (percentage >= 75) return 'bg-primary';
  if (percentage >= 50) return 'bg-warning-500';
  return 'bg-red-500';
}
