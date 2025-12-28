import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { ArrowLeft, Download, Printer } from 'lucide-react';

// Add declaration for html2pdf
declare var html2pdf: any;

interface ExamViewProps {
  content: string;
  onBack: () => void;
}

const ExamView: React.FC<ExamViewProps> = ({ content, onBack }) => {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('exam-content');
    if (!element) return;

    const opt = {
      margin:       [0.5, 0.5],
      filename:     `practice_exam_${new Date().toISOString().slice(0, 10)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, 
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
    } else {
        console.error("html2pdf library not loaded");
        // Fallback or alert
        alert("PDF generation library is loading or failed. Please try Print -> Save as PDF.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sticky top-4 z-10 bg-white/95 backdrop-blur py-4 px-6 rounded-xl shadow-sm border border-slate-200 print:hidden">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors mb-4 sm:mb-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <div className="flex gap-3">
           <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            title="Print Exam"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
           <button 
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-200"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Exam Content - ID added for html2pdf targeting */}
      <div id="exam-content" className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 min-h-screen">
        <article className="prose prose-slate prose-lg max-w-none 
          prose-headings:text-slate-900 prose-headings:font-bold
          prose-p:text-slate-700 prose-p:leading-relaxed
          prose-li:text-slate-700 
          prose-strong:text-slate-900 
          prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-medium
          prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:shadow-lg
          prose-img:rounded-xl prose-img:shadow-md prose-img:max-h-96 prose-img:object-contain prose-img:mx-auto prose-img:border prose-img:border-slate-100
          prose-table:border-collapse prose-table:w-full prose-table:shadow-sm prose-table:rounded-lg prose-table:overflow-hidden prose-table:my-8
          prose-th:bg-slate-50 prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:text-slate-900 prose-th:border-b prose-th:border-slate-200
          prose-td:p-4 prose-td:border-b prose-td:border-slate-100 prose-td:text-slate-600
          first:prose-tr:border-t-0 last:prose-tr:border-b-0">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};

export default ExamView;