import React, { useState } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import Dashboard from './components/Dashboard';
import ExamView from './components/ExamView';
import { analyzeExamContent, generatePracticeExam, generateSolutionWalkthrough } from './services/geminiService';
import { AppState, AnalysisResult, FileData, AppMode } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [appMode, setAppMode] = useState<AppMode>(null);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Persist source data to use during exam generation
  const [sourceFiles, setSourceFiles] = useState<FileData[]>([]);
  const [sourceText, setSourceText] = useState<string>('');

  const [examContent, setExamContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = (mode: AppMode) => {
    setAppMode(mode);
    setAppState(AppState.UPLOAD);
    setError(null);
  };

  const handleAnalyze = async (files: FileData[], text: string) => {
    try {
      setAppState(AppState.ANALYZING);
      setError(null);
      
      // Store inputs for the generation step
      setSourceFiles(files);
      setSourceText(text);
      
      const result = await analyzeExamContent(files, text);
      setAnalysisResult(result);
      setAppState(AppState.DASHBOARD);
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze the exam. Please try again with a different file or text.");
      setAppState(AppState.UPLOAD);
    }
  };

  // Only used in Deep Mode
  const handleWalkthrough = async () => {
    try {
        setAppState(AppState.GENERATING);
        setError(null);

        // Generate the step-by-step walkthrough of the original exam
        const walkthroughContent = await generateSolutionWalkthrough(sourceFiles, sourceText);
        
        setExamContent(walkthroughContent);
        setAppState(AppState.EXAM_VIEW);
    } catch (err: any) {
        console.error(err);
        setError("Failed to generate solution walkthrough. Please try again.");
        setAppState(AppState.DASHBOARD);
    }
  };

  const handleGenerateExam = async (difficulty: string) => {
    if (!analysisResult) return;
    
    try {
      setAppState(AppState.GENERATING);
      // Pass the original source content to ensure the exam is a faithful variation
      const content = await generatePracticeExam(
        analysisResult, 
        sourceFiles, 
        sourceText, 
        difficulty
      );
      setExamContent(content);
      setAppState(AppState.EXAM_VIEW);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate the exam. Please try again.");
      setAppState(AppState.DASHBOARD);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSourceFiles([]);
    setSourceText('');
    setExamContent('');
    setError(null);
    // Go back to upload, keeping current mode
    setAppState(AppState.UPLOAD);
  };

  const handleBackToDashboard = () => {
    setAppState(AppState.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {(appState === AppState.UPLOAD || appState === AppState.ANALYZING) && (
          <UploadSection 
            onAnalyze={handleAnalyze} 
            isProcessing={appState === AppState.ANALYZING} 
            onModeSelect={handleModeSelect}
            mode={appMode}
          />
        )}

        {(appState === AppState.DASHBOARD || appState === AppState.GENERATING) && analysisResult && (
          <Dashboard 
            analysis={analysisResult} 
            onGenerate={handleGenerateExam} 
            onWalkthrough={handleWalkthrough}
            isGenerating={appState === AppState.GENERATING}
            onReset={handleReset}
            mode={appMode}
          />
        )}

        {appState === AppState.EXAM_VIEW && (
          <ExamView 
            content={examContent} 
            onBack={handleBackToDashboard} 
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Examlytics. Built with React.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;