
export enum Sender {
  USER = 'USER',
  AI = 'AI'
}

export type Language = 'en' | 'zh';

export interface MessageAnalysis {
  subtext: string; // The psychological interpretation
  feedback?: string; // Short critique (Good job digging / You are pitching)
  score?: number; // 0-100 score for this specific message
  betterAlternative?: string; // The ideal question based on Mom Test
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  analysis: MessageAnalysis;
  isAnalysisVisible: boolean;
}

export interface Persona {
  name: string;
  role: string;
  problem: string; // Surface level problem
  currentSolution: string; // Surface level workaround
  // HIDDEN ATTRIBUTES (The user must dig for these)
  context: string; // The general hidden truth
  detailedWorkflow: string; // Step-by-step story of what they actually do (The "Gold")
  emotionalTrigger: string; // What specifically frustrates them in the workflow
}

export interface MessageFeedback {
  originalText: string;
  score: number;
  reason: string;
  betterAlternative?: string;
}

export interface GradingResult {
  totalScore: number; // Cumulative
  isLevelCleared: boolean; // GAME WIN STATE
  levelFeedback: string; // Why they won or lost
  summary: string;
  strengths: string[];
  weaknesses: string[];
  lineByLineAnalysis: MessageFeedback[];
}
