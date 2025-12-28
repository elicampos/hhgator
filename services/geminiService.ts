import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, FileData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-flash-preview";

// Helper for timeout and retry logic
const callWithTimeoutAndRetry = async <T>(
  fn: () => Promise<T>,
  retries = 1,
  timeout = 60000 * 3
): Promise<T> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeout)
      );
      return await Promise.race([fn(), timeoutPromise]);
    } catch (e: any) {
      console.warn(`Attempt ${attempt + 1} failed/timed out:`, e);
      if (attempt === retries) {
        if (e.message === "Request timed out") {
          throw new Error(
            "The request took too long to process. Please try again."
          );
        }
        throw e;
      }
      // Small delay before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Request failed");
};

export const solveExam = async (
  filesData: FileData[],
  rawText: string
): Promise<string> => {
  try {
    const parts: any[] = [];

    // Add text input
    if (rawText.trim()) {
      parts.push({ text: `RAW TEXT INPUT:\n${rawText}` });
    }

    // Process files
    for (let i = 0; i < filesData.length; i++) {
      const file = filesData[i];
      if (file.isText) {
        parts.push({
          text: `FILE ${i + 1} (${file.name}) CONTENT:\n${file.data}`,
        });
      } else {
        const base64Data = file.data.split(",")[1];
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: base64Data,
          },
        });
      }

      // Include extracted PDF images if any
      if (file.extractedImages && file.extractedImages.length > 0) {
        file.extractedImages.forEach((base64Img, idx) => {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Img.split(",")[1],
            },
          });
          parts.push({ text: `[Context: Image ${idx} from ${file.name}]` });
        });
      }
    }

    const prompt = `
      You are an expert tutor and exam solver.
      
      TASK:
      1. Solve every question found in the provided files and text.
      2. If multiple files are provided, treat them as a single exam.
      3. For each question, provide a detailed Step-by-Step solution.
      
      FORMATTING:
      - Use standard Markdown.
      - Use LaTeX for math ($...$ for inline, $$...$$ for block).
      - Structure the output as follows:
      
      # Exam Solutions
      
      ## Question [Number]
      **Problem Statement**: [Brief summary of the question]
      
      **Step-by-Step Solution**:
      1. [Step 1 logic]
         $$[Math]$$
      2. [Step 2 logic]
         $$[Math]$$
      
      **Final Answer**:
      $$[Answer]$$
      
      ---
    `;

    parts.push({ text: prompt });

    const response = await callWithTimeoutAndRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          role: "user",
          parts: parts,
        },
        config: {
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 2048 },
        },
      });
    });

    return response.text || "Failed to solve exam.";
  } catch (error) {
    console.error("Solver failed:", error);
    throw error;
  }
};

export const generateSolutionWalkthrough = async (
  filesData: FileData[],
  rawText: string
): Promise<string> => {
  try {
    const parts: any[] = [];

    // Pass original content
    if (rawText.trim()) parts.push({ text: `RAW TEXT INPUT:\n${rawText}` });

    let globalImageIndex = 0;

    for (let i = 0; i < filesData.length; i++) {
      const file = filesData[i];
      // Explicitly label the category for the model
      const categoryLabel =
        file.category === "answer"
          ? "PROVIDED ANSWER KEY / SOLUTIONS"
          : "QUESTION SHEET";

      if (file.isText) {
        parts.push({
          text: `FILE ${i + 1} (${
            file.name
          }) [TYPE: ${categoryLabel}] CONTENT:\n${file.data}`,
        });
      } else {
        const base64Data = file.data.split(",")[1];
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: base64Data,
          },
        });
        parts.push({ text: `[Context: FILE ${i + 1} is a ${categoryLabel}]` });
      }

      if (file.extractedImages && file.extractedImages.length > 0) {
        file.extractedImages.forEach((base64Img) => {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Img.split(",")[1],
            },
          });
          parts.push({
            text: `[Context: Image ${globalImageIndex++} from ${
              file.name
            } (${categoryLabel})]`,
          });
        });
      }
    }

    const prompt = `
      You are an expert Professor of the highest caliber who believes in **Teaching from First Principles**.
      
      **OBJECTIVE**: Create a "Deep Dive Solution Walkthrough" for the provided exam content.
      
      **CRITICAL INSTRUCTION**: The Exam Questions and Answer Keys have been uploaded as files above. 
      DO NOT ASK for the files. They are already attached.
      DO NOT respond with "I am ready".
      START GENERATING THE WALKTHROUGH IMMEDIATELY.
      
      **PEDAGOGICAL APPROACH (FIRST PRINCIPLES)**:
      - **Do not hold back.** Assume the student wants the absolute truth of how the problem works, not just a shortcut.
      - **Do not simply state a formula** and plug in numbers. 
      - **Explain WHY the formula exists.** If it is a derived concept (like Kinetic Energy or Integration by Parts), briefly remind the student of the physical or logical origin.
      - Connect every step to a fundamental truth (e.g., "Because mass is conserved...", "Because the limit approaches zero...").
      
      **CONTEXT**: 
      The user may have provided two types of files:
      1. **Question Sheets**: The original problems.
      2. **Answer Keys / Solutions**: The correct answers (which might be brief, e.g., just "C" or a final number).
      
      **YOUR TASK**:
      1. **Correlate**: Match every question from the Question Sheet to its corresponding answer in the Answer Key (if available).
      2. **Deconstruct & Solve**: Explain the solution with extreme rigor.
      
      **OUTPUT FORMAT**:
      Produce a clean Markdown document.
      
      # Deep Review: First Principles Walkthrough
      
      ---
      ## Question [Number]
      
      **The Question**: 
      [Brief summary of the question text or "Refer to image X"]
      
      **The Answer**:
      [The final answer found in the key or derived by you]
      
      **First Principles Derivation & Walkthrough**:
      
      1. **Fundamental Concept**: 
         *What is the single core truth governing this problem? (e.g., Conservation of Angular Momentum, The Chain Rule).* Explain it briefly in plain English.
      
      2. **The Setup (From Scratch)**:
         *Don't just jump to equation 3. Start at equation 1. Show how we translate the word problem into a mathematical model.*
      
      3. **Rigorous Execution**:
         $$ [Math Steps] $$
         *Show the intermediate algebra. Do not skip steps. Explain the logic between lines.*
      
      4. **Intuition Check**: 
         *Why does this answer make sense physically or logically? Does it hold up at the extremes (e.g., if mass was 0)?*
      
      ---
      
      (Repeat for all questions)
    `;

    parts.push({ text: prompt });

    const response = await callWithTimeoutAndRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          role: "user",
          parts: parts,
        },
        config: {
          temperature: 0.4,
          thinkingConfig: { thinkingBudget: 8192 }, // Increased budget for deep first-principles thinking
        },
      });
    });

    return response.text || "Failed to generate walkthrough.";
  } catch (error) {
    console.error("Walkthrough generation failed:", error);
    throw error;
  }
};

export const analyzeExamContent = async (
  filesData: FileData[],
  rawText: string
): Promise<AnalysisResult> => {
  try {
    const parts: any[] = [];
    const fileCount = filesData.length;

    // Add system instruction context to the prompt
    let prompt = `
      You are an expert educational content analyzer. 
      Analyze the provided exam content (files and text).
      
      CONTEXT: You have been provided with ${fileCount} file(s)${
      rawText ? " and raw text input" : ""
    }. 
      CRITICAL: You must treat ALL provided content as a SINGLE aggregated dataset. Do not analyze files individually; combine all questions found across all files into one pool for analysis.
      CRITICAL: The content is attached. Do not ask for it. Output JSON ONLY.
      
      NOTE ON FILE TYPES:
      Some files may be labeled as "Question Sheet" and others as "Answer Key". Use the Answer Keys to understand the *depth* of answer required and to verify topics, but base the "Question Count" on the questions themselves.

      Your tasks:
      1. Identify the types of questions used (e.g., Multiple Choice, Short Answer, Essay, Coding).
      2. **Topic Analysis & Distribution** (Strict Math Required): 
         - Step A: Count the TOTAL number of distinct questions across ALL provided files.
         - Step B: Categorize each question into a core topic.
         - Step C: For EACH topic, calculate its percentage: (Topic Question Count / Total Questions) * 100.
         - Step D: Verify your math. The sum of all topic percentages MUST equal exactly 100%. Adjust decimals if necessary to ensure this sum.
         - Step E: Provide a description and a YouTube search query for each topic.
      3. Identify "Fair Game" content. These are questions that are NOT explicitly in the file but are logically related. 
         - Look for "Reverse Operations" (e.g., if the exam asks for derivatives, integrals are fair game).
         - Look for different question formats covering the same subject.
         - Provide 3-4 distinct examples of these "Fair Game" questions.
      4. **Image Context**: I have attached images extracted from the files. 
         - Use these to understand the context of questions that rely on diagrams.
         - Map the image content to the topics.
      5. Write a brief summary of the exam's difficulty and focus.
         - MANDATORY: Explicitly state in the summary: "Analyzed [Total Count] questions across [File Count] files." so the user can verify the count.

      Return the response in strictly valid JSON format matching the schema.
    `;

    if (rawText.trim()) {
      parts.push({ text: `RAW TEXT INPUT:\n${rawText}` });
    }

    let globalImageIndex = 0;
    let imageContext = "\n\nEXTRACTED DIAGRAMS FOR ANALYSIS:\n";
    let hasImages = false;

    // Iterate through all provided files
    for (let i = 0; i < filesData.length; i++) {
      const file = filesData[i];
      const categoryLabel =
        file.category === "answer"
          ? "ANSWER KEY / SOLUTIONS"
          : "QUESTION SHEET";

      // Add text/binary content
      if (file.isText) {
        parts.push({
          text: `FILE ${i + 1} (${
            file.name
          }) [TYPE: ${categoryLabel}] CONTENT:\n${file.data}`,
        });
      } else {
        const base64Data = file.data.split(",")[1];
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: base64Data,
          },
        });
        parts.push({ text: `[Context: FILE ${i + 1} is a ${categoryLabel}]` });
      }

      // Add extracted images from this file
      if (file.extractedImages && file.extractedImages.length > 0) {
        file.extractedImages.forEach((base64Img) => {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Img.split(",")[1],
            },
          });
          imageContext += `- EXTRACTED_IMAGE_${globalImageIndex} is attached (From ${file.name} - ${categoryLabel}).\n`;
          globalImageIndex++;
          hasImages = true;
        });
      }
    }

    if (hasImages) {
      parts.push({ text: imageContext });
    }

    // Define Schema
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        questionTypes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of question types found in the exam",
        },
        topics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              percentage: {
                type: Type.NUMBER,
                description: "Percentage of exam covering this topic (0-100)",
              },
              description: { type: Type.STRING },
              youtubeQuery: {
                type: Type.STRING,
                description:
                  "A targeted search query to find a video on this topic",
              },
            },
            required: ["name", "percentage", "description", "youtubeQuery"],
          },
        },
        fairGame: {
          type: Type.ARRAY,
          description: "List of fair game questions",
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              type: { type: Type.STRING },
              exampleQuestion: { type: Type.STRING },
              reasoning: { type: Type.STRING },
            },
            required: ["topic", "type", "exampleQuestion", "reasoning"],
          },
        },
        imageAnalysis: {
          type: Type.ARRAY,
          description: "Mapping of extracted images to their contents",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "EXTRACTED_IMAGE_X" },
              description: {
                type: Type.STRING,
                description: "What does this image show?",
              },
              relatedTopic: {
                type: Type.STRING,
                description: "What topic does this image belong to?",
              },
            },
            required: ["id", "description", "relatedTopic"],
          },
        },
        summary: {
          type: Type.STRING,
          description:
            "A brief summary of the exam content, difficulty, and question count.",
        },
      },
      required: [
        "questionTypes",
        "topics",
        "fairGame",
        "imageAnalysis",
        "summary",
      ],
    };

    const response = await callWithTimeoutAndRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          role: "user",
          parts: [...parts, { text: prompt }],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2, // Low temperature for factual analysis
        },
      });
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generatePracticeExam = async (
  analysis: AnalysisResult,
  originalFiles: FileData[],
  originalText: string,
  difficulty: string = "Medium",
  numQuestions: number = 10
): Promise<string> => {
  try {
    const parts: any[] = [];

    // 1. Pass the original content to the model for "Grounding"
    if (originalText.trim()) {
      parts.push({ text: `ORIGINAL EXAM TEXT CONTENT:\n${originalText}` });
    }

    let globalImageIndex = 0;
    let imageContext = "\n\nEXTRACTED DIAGRAMS FROM PDF (For Context Only):\n";
    let hasImages = false;

    for (let i = 0; i < originalFiles.length; i++) {
      const file = originalFiles[i];
      if (file.isText) {
        parts.push({
          text: `ORIGINAL EXAM FILE ${i + 1} (${file.name}) CONTENT:\n${
            file.data
          }`,
        });
      } else {
        // Pass the actual PDF/Image again so the model can "see" the exact questions
        const base64Data = file.data.split(",")[1];
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: base64Data,
          },
        });
      }

      // Pass extracted images as inline data so the model has context
      if (file.extractedImages && file.extractedImages.length > 0) {
        file.extractedImages.forEach((base64Img) => {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Img.split(",")[1],
            },
          });
          imageContext += `- EXTRACTED_IMAGE_${globalImageIndex} is provided as an attachment above (From ${file.name}).\n`;
          globalImageIndex++;
          hasImages = true;
        });
      }
    }

    if (hasImages) {
      parts.push({ text: imageContext });
    }

    let difficultyInstruction = "";
    switch (difficulty) {
      case "Easy":
        difficultyInstruction =
          "Create questions that are slightly easier than the original material. Simplify complex numbers, remove one layer of logic, or provide hints.";
        break;
      case "Hard":
        difficultyInstruction =
          "Create questions that are more challenging. Combine concepts, use tougher numbers, or require deeper synthesis of the material.";
        break;
      case "Medium":
      default:
        difficultyInstruction =
          "Strictly mirror the difficulty of the original exam. The questions should feel like a 'Version B' of the original.";
        break;
    }

    const prompt = `
      You are an expert exam creator. Your task is to create a Practice Exam based on the ORIGINAL EXAM provided above.
      
      General Strategy:
      1. Analyze the Original Exam question by question.
      2. For each question, create a "partner" question that tests the same concept but with changed values or perspective.
      3. Maintain the style and tone of the original.
      
      Handling Diagrams/Visuals:
      - **DO NOT** attempt to insert images or use ![Diagram] syntax.
      - If a question relies on a specific diagram from the original file:
        - Option A: **Describe** the geometry or setup clearly in text so the diagram is not needed (e.g., "Imagine a right triangle where leg A is...").
        - Option B: **Reference** the original document (e.g., "Refer to the circuit diagram in Question 5 of your original uploaded exam (File: X), but assume the voltage is 24V instead of 12V").

      Parameters:
      - Target Difficulty: ${difficulty} (${difficultyInstruction})
      - Number of Questions: ${numQuestions}
      
      Formatting Requirements:
      1. **Header**: Include a Title (e.g., "Practice Exam") and an "Instructions" section (e.g., "Show all work. Time Limit: 60 mins"). **DO NOT** include fields for Name, Date, or Class.
      2. **Question Layout**: If a question has parts (a, b, c), put EACH part on a new line with a blank line between them for ample workspace.
      3. **Math**: Use standard LaTeX formatting. Inline: $E=mc^2$. Block: $$x=...$$.
      4. **Charts/Tables**: If generating a table, use strictly valid Markdown Table syntax.
      
      Answer Key Requirements (Vertical Layout):
      You MUST place the Answer Key at the end of the document.
      **CRITICAL**: The numbering MUST match exactly. Question 1 corresponds to Solution 1.
      
      For EACH solution, you must use the following VERTICAL format to reduce clutter and show thinking:

      ---
      ### Solution [Question Number]
      
      **Base Formulas:**
      * $Formula 1$
      * $Formula 2$
      
      **Step-by-Step Execution:**
      
      1. **[Action Word/Concept]**: [Brief explanation]
         $$[Math/Substitution]$$
      
      2. **[Action Word/Concept]**: [Brief explanation]
         $$[Math/Substitution]$$
      
      3. **[Conclusion]**: [Final Statement]
         $$[Final Answer]$$

      **Related Resource:**
      [Watch video on [Topic]](https://www.youtube.com/results?search_query=[Topic])
      ---

      Output Format:
      - Clean Markdown.
      - Questions first (Section 1).
      - Answer Key second (Section 2).
    `;

    parts.push({ text: prompt });

    const response = await callWithTimeoutAndRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          role: "user",
          parts: parts,
        },
        config: {
          temperature: 0.5,
          thinkingConfig: { thinkingBudget: 2048 },
        },
      });
    });

    return response.text || "Failed to generate exam content.";
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};
