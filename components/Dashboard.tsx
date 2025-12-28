import React, { useState } from 'react';
import { AnalysisResult, AppMode } from '../types';
import { Youtube, FileQuestion, ArrowRight, PlayCircle, Scale, Settings, BookOpenCheck } from 'lucide-react';

interface DashboardProps {
  analysis: AnalysisResult;
  onGenerate: (difficulty: string) => void;
  onWalkthrough: () => void;
  isGenerating: boolean;
  onReset: () => void;
  mode: AppMode;
}

const Dashboard: React.FC<DashboardProps> = ({ analysis, onGenerate, onWalkthrough, isGenerating, onReset, mode }) => {
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleGenerate = (diff: string) => {
    setLoadingAction('generate');
    onGenerate(diff);
  };

  const handleWalkthrough = () => {
    setLoadingAction('walkthrough');
    onWalkthrough();
  };

  // Reset local loading if parent prop becomes false (finished)
  React.useEffect(() => {
    if (!isGenerating) {
        setLoadingAction(null);
    }
  }, [isGenerating]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header with Summary */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex items-center gap-3">
                 <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Exam Analysis</h2>
                 <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wide ${mode === 'DEEP' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
                    {mode === 'DEEP' ? 'Deep Review' : 'Standard'}
                 </span>
              </div>
              <p className="text-slate-500 text-sm mt-1 uppercase tracking-wide font-semibold">Overview & Insights</p>
            </div>
            <p className="text-slate-700 leading-relaxed text-lg max-w-4xl">
              {analysis.summary}
            </p>
          </div>
          <button 
             onClick={onReset}
             className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-4 transition-colors"
          >
            Start New Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Fair Game */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Fair Game Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Fair Game Concepts</h3>
            </div>
            <div className="space-y-4">
              {analysis.fairGame && analysis.fairGame.length > 0 ? (
                analysis.fairGame.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{item.type}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">{item.topic}</p>
                    <p className="text-sm text-slate-600 italic">"{item.exampleQuestion}"</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No specific fair game content detected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Topics & Videos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Youtube className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Study Guide & Resources</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {analysis.topics.map((topic, idx) => {
              return (
                <div key={idx} className="group p-5 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col justify-between items-start gap-4">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-slate-900 text-lg">{topic.name}</h4>
                        {topic.percentage !== undefined && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">
                            {topic.percentage}% of Exam
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">{topic.description}</p>
                      
                      <a 
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic.youtubeQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors group-hover:underline decoration-red-600/30 underline-offset-4"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Watch Tutorial Video
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-6 z-40">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 flex flex-col xl:flex-row items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row gap-6 w-full xl:w-auto">
                {/* Walkthrough Button - Only for DEEP Mode */}
                 {mode === 'DEEP' ? (
                     <button
                        onClick={handleWalkthrough}
                        disabled={isGenerating}
                        className="flex-1 xl:flex-none px-6 py-3 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                         {loadingAction === 'walkthrough' ? (
                            <span className="flex items-center gap-2">
                                 <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 Analyzing...
                            </span>
                         ) : (
                             <>
                                <BookOpenCheck className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                <span>Explain Original Solutions</span>
                             </>
                         )}
                    </button>
                 ) : (
                     <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 cursor-not-allowed" title="Available in Deep Review Mode only">
                         <BookOpenCheck className="w-5 h-5" />
                         <span className="text-sm font-medium">Solutions Walkthrough (Deep Mode Only)</span>
                     </div>
                 )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto border-t xl:border-t-0 border-slate-100 pt-4 xl:pt-0">
                <div className="flex items-center gap-2 px-2 hidden xl:flex">
                    <FileQuestion className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-500">Practice Exam:</span>
                </div>
                
                {/* Difficulty Dropdown */}
                <div className="relative group min-w-[140px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Settings className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    </div>
                </div>

                <button
                    onClick={() => handleGenerate(difficulty)}
                    disabled={isGenerating}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {loadingAction === 'generate' ? (
                        <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                        </>
                    ) : (
                    <>
                        Generate Practice Exam
                        <ArrowRight className="w-5 h-5" />
                    </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;