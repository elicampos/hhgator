import React, { useCallback, useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Plus,
  Calculator,
  BookOpen,
  Layers,
  CheckCircle,
  FileQuestion,
  BookOpenCheck,
} from "lucide-react";
import { FileData, AppMode } from "../types";
import { extractImagesFromPdf } from "../utils/pdfUtils";

interface UploadSectionProps {
  onAnalyze: (files: FileData[], text: string) => void;
  isProcessing: boolean;
  onModeSelect: (mode: AppMode) => void;
  mode: AppMode;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  isProcessing,
  onModeSelect,
  mode,
}) => {
  const [textInput, setTextInput] = useState("");

  // State for file categories
  const [questionFiles, setQuestionFiles] = useState<FileData[]>([]);
  const [answerFiles, setAnswerFiles] = useState<FileData[]>([]);

  // Toggle for Deep mode
  // Default to false (unchecked) based on user request
  const [hasSeparateKey, setHasSeparateKey] = useState(false);

  // Sync state with mode - ensure it resets to false when entering any mode
  useEffect(() => {
    setHasSeparateKey(false);
  }, [mode]);

  // Drag states
  const [dragActiveQ, setDragActiveQ] = useState(false);
  const [dragActiveA, setDragActiveA] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  // -- Helpers --

  const processFiles = async (
    files: File[],
    category: "question" | "answer"
  ) => {
    setIsReadingFiles(true);
    const newFiles: FileData[] = [];

    for (const file of files) {
      const isTextFile =
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md");
      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      let extractedImages: string[] = [];
      if (isPdf) {
        try {
          extractedImages = await extractImagesFromPdf(file);
        } catch (e) {
          console.warn(`Could not extract images from PDF ${file.name}`, e);
        }
      }

      try {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          if (isTextFile) {
            reader.readAsText(file);
          } else {
            // This works for both PDFs (application/pdf) and Images (image/png, etc.)
            reader.readAsDataURL(file);
          }
        });

        newFiles.push({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          data: data,
          isText: isTextFile,
          extractedImages:
            extractedImages.length > 0 ? extractedImages : undefined,
          category: category,
        });
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }

    if (category === "question") {
      setQuestionFiles((prev) => [...prev, ...newFiles]);
    } else {
      setAnswerFiles((prev) => [...prev, ...newFiles]);
    }
    setIsReadingFiles(false);
  };

  const handleDrag = (e: React.DragEvent, setDrag: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDrag(true);
    } else if (e.type === "dragleave") {
      setDrag(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    category: "question" | "answer",
    setDrag: (val: boolean) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files), category);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: "question" | "answer"
  ) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files), category);
    }
  };

  const removeFile = (index: number, category: "question" | "answer") => {
    if (category === "question") {
      setQuestionFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAnswerFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    // Combine files for processing
    const allFiles = [...questionFiles, ...answerFiles];
    if (allFiles.length === 0 && !textInput.trim()) return;

    // Both modes use the analyze flow now
    onAnalyze(allFiles, textInput);
  };

  // -- Render Components --

  const renderFileItem = (
    file: FileData,
    idx: number,
    category: "question" | "answer"
  ) => (
    <div
      key={idx}
      className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-2"
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            category === "question" ? "bg-blue-100" : "bg-amber-100"
          }`}
        >
          {file.mimeType.startsWith("image/") ? (
            <div className="w-5 h-5 flex items-center justify-center font-bold text-xs text-slate-600">
              IMG
            </div>
          ) : (
            <FileText
              className={`w-5 h-5 ${
                category === "question" ? "text-blue-600" : "text-amber-600"
              }`}
            />
          )}
        </div>
        <div className="text-left min-w-0">
          <p className="font-semibold text-slate-900 truncate">{file.name}</p>
          <p className="text-xs text-slate-500 truncate">
            {file.extractedImages
              ? `${file.extractedImages.length} extracted images`
              : file.mimeType.split("/")[1].toUpperCase()}
          </p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeFile(idx, category);
        }}
        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const renderDropzone = (
    title: string,
    files: FileData[],
    category: "question" | "answer",
    isActive: boolean,
    setIsActive: (val: boolean) => void,
    colorClass: string
  ) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
        {title}
      </h3>
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ease-in-out text-center ${
          isActive
            ? `border-${colorClass}-500 bg-${colorClass}-50`
            : "border-slate-300 hover:border-slate-400 bg-slate-50"
        }`}
        onDragEnter={(e) => handleDrag(e, setIsActive)}
        onDragLeave={(e) => handleDrag(e, setIsActive)}
        onDragOver={(e) => handleDrag(e, setIsActive)}
        onDrop={(e) => handleDrop(e, category, setIsActive)}
      >
        {files.length > 0 ? (
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {files.map((f, i) => renderFileItem(f, i, category))}
            <label className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-slate-50">
              <Plus className="w-3 h-3" /> Add More
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleChange(e, category)}
                accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                multiple
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <div className="mx-auto bg-white w-12 h-12 rounded-full shadow-sm flex items-center justify-center">
              <UploadCloud className={`w-6 h-6 text-${colorClass}-500`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Drag & Drop or Click
              </p>
              <p className="text-xs text-slate-500">PDF, Images, Text</p>
            </div>
            <input
              type="file"
              className="hidden"
              id={`upload-${category}`}
              onChange={(e) => handleChange(e, category)}
              accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
              multiple
            />
            <label
              htmlFor={`upload-${category}`}
              className="inline-block px-4 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer shadow-sm"
            >
              Browse
            </label>
          </div>
        )}
      </div>
    </div>
  );

  // -- Main Views --

  if (!mode) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-12 animate-fade-in py-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
            Examlytics
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Select your analysis mode to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => onModeSelect("STANDARD")}
            className="group relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:border-blue-500 hover:shadow-2xl transition-all text-left flex flex-col h-full"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileQuestion className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Standard Analysis
              </h2>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mt-1">
                Requires: Practice Exam Only
              </p>
            </div>
            <p className="text-slate-600 leading-relaxed mb-6 flex-grow">
              Upload your blank practice exam. We'll analyze the topics,
              identify fair game concepts, and generate a new custom practice
              test for you.
            </p>
            <div className="flex items-center text-blue-600 font-bold">
              Analyze Exam{" "}
              <span className="ml-2 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </button>

          <button
            onClick={() => onModeSelect("DEEP")}
            className="group relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:border-indigo-500 hover:shadow-2xl transition-all text-left flex flex-col h-full"
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpenCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Deep Review & Solutions
              </h2>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mt-1">
                Requires: Exam + Answer Key
              </p>
            </div>
            <p className="text-slate-600 leading-relaxed mb-6 flex-grow">
              Upload your exam <strong>with the answer key</strong> either as
              separate files or combined. Get everything in Standard, PLUS a
              detailed step-by-step walkthrough explaining exactly how to solve
              your original questions.
            </p>
            <div className="flex items-center text-indigo-600 font-bold">
              Start Deep Review{" "}
              <span className="ml-2 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            onModeSelect(null);
            setQuestionFiles([]);
            setAnswerFiles([]);
            setHasSeparateKey(false);
          }}
          className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-1"
        >
          ← Back to Menu
        </button>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            mode === "STANDARD"
              ? "bg-blue-100 text-blue-700"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {mode === "STANDARD" ? "Standard Analysis Mode" : "Deep Review Mode"}
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {mode === "STANDARD"
            ? "Upload Practice Exam"
            : "Upload Exam & Solutions"}
        </h1>
        <p className="text-slate-600">
          {mode === "DEEP"
            ? "For Deep Review, please upload both the blank exam and the solution key."
            : "Upload your practice questions PDF, text, or images."}
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        {/* Deep Mode Toggle / Info */}
        {mode === "DEEP" && (
          <div className="mb-8 flex items-center justify-center">
            <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl bg-slate-50 border border-slate-200 transition-colors hover:bg-slate-100">
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center ${
                  hasSeparateKey
                    ? "bg-indigo-600 border-indigo-600"
                    : "bg-white border-slate-300"
                }`}
              >
                {hasSeparateKey && (
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={hasSeparateKey}
                onChange={() => setHasSeparateKey(!hasSeparateKey)}
              />
              <span className="text-sm font-medium text-slate-700">
                I have a separate Solution / Answer Key file
              </span>
            </label>
          </div>
        )}

        <div
          className={`grid grid-cols-1 ${
            hasSeparateKey && mode === "DEEP" ? "md:grid-cols-2 gap-6" : "gap-0"
          }`}
        >
          {/* Main Dropzone (Questions) */}
          {renderDropzone(
            mode === "DEEP" && hasSeparateKey
              ? "Exam Questions"
              : "Upload Files",
            questionFiles,
            "question",
            dragActiveQ,
            setDragActiveQ,
            "blue"
          )}

          {/* Secondary Dropzone (Answers) - Only if enabled in Deep Mode */}
          {mode === "DEEP" &&
            hasSeparateKey &&
            renderDropzone(
              "Answer Key / Solutions",
              answerFiles,
              "answer",
              dragActiveA,
              setDragActiveA,
              "amber"
            )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">
              Or paste text directly
            </span>
          </div>
        </div>

        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste question text or notes here..."
          className="w-full h-24 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow text-sm"
        ></textarea>

        <button
          onClick={handleSubmit}
          disabled={
            (questionFiles.length === 0 &&
              answerFiles.length === 0 &&
              !textInput.trim()) ||
            isProcessing ||
            isReadingFiles
          }
          className={`w-full mt-6 py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
            (questionFiles.length === 0 &&
              answerFiles.length === 0 &&
              !textInput.trim()) ||
            isProcessing ||
            isReadingFiles
              ? "bg-slate-300 cursor-not-allowed shadow-none"
              : mode === "STANDARD"
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/30"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30"
          }`}
        >
          {isProcessing || isReadingFiles ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isReadingFiles ? "Reading Files..." : "Processing..."}
            </span>
          ) : (
            "Start Analysis"
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
