export interface AnalysisResult {
  questionTypes: string[];
  topics: TopicInfo[];
  fairGame: FairGameItem[];
  imageAnalysis: DetectedImage[]; // New field for mapped images
  summary: string;
}

export interface DetectedImage {
  id: string; // e.g. "EXTRACTED_IMAGE_0"
  description: string;
  relatedTopic: string;
}

export interface TopicInfo {
  name: string;
  percentage: number; // Added percentage directly here to ensure 1-to-1 mapping
  description: string;
  youtubeQuery: string;
}

export interface FairGameItem {
  topic: string;
  type: string; // e.g., "Reverse Operation", "Conceptual Application"
  exampleQuestion: string;
  reasoning: string;
}

export interface ExamGenerationResult {
  markdownContent: string;
}

export type AppMode = 'STANDARD' | 'DEEP' | null;

export enum AppState {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  SOLVING = 'SOLVING', // Kept for type safety, though likely unused in new flow
  DASHBOARD = 'DASHBOARD',
  GENERATING = 'GENERATING',
  EXAM_VIEW = 'EXAM_VIEW',
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 or text content
  isText: boolean;
  extractedImages?: string[]; // Array of Base64 image strings extracted from PDF
  category?: 'question' | 'answer'; // Tag to distinguish file types
}