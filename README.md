# Examlytics

Examlytics is an intelligent, AI-powered educational tool designed to help students analyze practice exams, understand complex solutions from first principles, and generate custom practice material.

Built with **React**, **TypeScript**, **Tailwind CSS**, and powered by **Google's Gemini 3 Flash & Pro** models.

## Key Features

### 1. Two Powerful Modes

- **Standard Analysis**: Upload a blank practice exam. The AI analyzes the topic distribution, identifies "fair game" concepts (related topics not explicitly asked), and generates a brand new practice exam with similar difficulty.
- **Deep Review & Solutions**: Upload both the exam questions and the answer key. The AI acts as an expert professor, correlating questions to answers and providing a **First Principles Walkthrough**—explaining the _why_ and _how_ of a solution physically and logically, rather than just showing the math.

### 2. Intelligent Document Processing

- **PDF & Image Support**: Drag and drop PDFs, images, or text files.
- **Visual Context**: Automatically extracts diagrams and images from PDFs to give the AI context for geometry or physics problems.
- **Client-Side Processing**: Uses `pdfjs-dist` to parse documents and extract images directly in the browser.

### 3. Study Resources

- **Topic Breakdown**: detailed percentage breakdown of exam topics.
- **YouTube Integration**: Automatically generates search queries and links to relevant video tutorials for every topic found in the exam.
- **Fair Game Analysis**: Identifies concepts that are logically related to the exam material (e.g., if the exam asks for derivatives, integrals are flagged as "fair game").

### 4. Generation & Export

- **Custom Practice Exams**: Generates valid Markdown/LaTeX exams based on the analysis.
- **Difficulty Settings**: specific logic to generate Easy (simplified concepts), Medium (mirrored difficulty), or Hard (synthesis required) variations.
- **PDF Export**: Built-in support to download generated study guides and exams as PDFs.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS (with Typography plugin)
- **AI Model**: Google Gemini API (`gemini-3-flash-preview` for analysis, `gemini-3-pro-preview` for deep reasoning) via `@google/genai` SDK.
- **PDF Processing**: `pdfjs-dist` (Parsing), `html2pdf.js` (Export).
- **Rendering**: `react-markdown`, `katex` (Math rendering), `lucide-react` (Icons).

## Setup & Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/your-username/examlytics.git
    cd examlytics
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure API Key**
    You need a valid Google Gemini API Key.

    - Create a `.env` file in the root directory.
    - Add your key:
      ```env
      API_KEY=your_google_gemini_api_key_here
      ```
    - _Note: Ensure your build tool (e.g., Vite/Webpack) is configured to expose `process.env.API_KEY` or `import.meta.env` appropriately._

4.  **Run the application**
    ```bash
    npm start
    ```

### Configuration (Optional)

#### Changing the AI Model

By default, the application is configured to use `gemini-3-flash-preview` for the best balance of reasoning and analysis. If you wish to use a different model (e.g., `gemini-3-pro-preview` for better results, or a newer model version):

1.  Open `services/geminiService.ts`.
2.  Locate the `MODEL_NAME` constant near the top of the file:
    ```typescript
    const MODEL_NAME = "gemini-3-pro-preview";
    ```
3.  Update this string to your desired model name (e.g., `"gemini-3-pro-preview"`).

## How to Use

### Standard Mode

1.  Select **Standard Analysis**.
2.  Upload a PDF of a past exam or practice test.
3.  Click **Analyze**.
4.  Review the topic breakdown and "Fair Game" concepts.
5.  Select a difficulty (Easy/Medium/Hard) and click **Generate Practice Exam**.

### Deep Review Mode

1.  Select **Deep Review**.
2.  Check the "I have a separate Solution / Answer Key file" box (if applicable).
3.  Upload the **Questions** file in the blue zone and the **Answers** file in the orange zone.
4.  Click **Analyze** to get the topic breakdown.
5.  Click **Explain Original Solutions** to generate a rigorous, step-by-step walkthrough of the uploaded exam derived from first principles.

## License

This project is open source and available under the [MIT License](LICENSE).
