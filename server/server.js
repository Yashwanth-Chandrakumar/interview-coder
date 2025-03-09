const express = require("express");
const cors = require("cors");
const { TextractClient, DetectDocumentTextCommand } = require("@aws-sdk/client-textract");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize AWS Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: "AKIAV5D5D3BBYBMSARWE",
    secretAccessKey: "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"
  }
});

// Increase payload size for image data
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize Groq SDK instance with your API key
const apiKey = process.env.GROQ_API_KEY || "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";
console.log(`Using Groq API key: ${apiKey.substring(0, 10)}...`);
const groq = new Groq({ apiKey });

// Supported Tesseract languages
const SUPPORTED_LANGUAGES = ["eng", "fra", "deu", "spa", "ita", "por", "chi_sim", "chi_tra", "jpn", "kor", "ara", "hin", "rus"];

// Save base64 image to a temporary file
const saveBase64ImageToTemp = (base64Data) => {
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Image, "base64");
  const fileName = `image_${crypto.randomBytes(16).toString("hex")}.png`;
  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

// Extract text from an image using AWS Textract
const extractTextWithTextract = async (imagePath) => {
  try {
    // Read the image file into a buffer
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Prepare the Textract command
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: imageBuffer
      }
    });
    
    // Process the image with Textract
    const response = await textractClient.send(command);
    
    // Extract and concatenate all detected text blocks
    let extractedText = "";
    if (response.Blocks) {
      // Filter for text blocks and sort by position (top to bottom)
      const textBlocks = response.Blocks
        .filter(block => block.BlockType === "LINE")
        .sort((a, b) => {
          return (a.Geometry?.BoundingBox?.Top || 0) - (b.Geometry?.BoundingBox?.Top || 0);
        });
      
      // Concatenate the text from each block
      extractedText = textBlocks.map(block => block.Text).join("\n");
    }
    
    return extractedText;
  } catch (error) {
    console.error("Textract processing error:", error);
    throw new Error(`AWS Textract error: ${error.message}`);
  }
};

// API endpoint for text extraction from images
app.post("/api/extract", async (req, res) => {
  const { imageDataList, language = "eng" } = req.body;
  const tempFiles = [];
  
  try {
    if (!imageDataList || !Array.isArray(imageDataList) || imageDataList.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }
    
    const ocrResults = [];

    // Process each image
    for (const imageData of imageDataList) {
      // Save base64 image to a temporary file
      const imagePath = saveBase64ImageToTemp(imageData);
      tempFiles.push(imagePath);
      console.log(`Saved temporary image to: ${imagePath}`);
      
      // Extract text using AWS Textract
      const extractedText = await extractTextWithTextract(imagePath);
      ocrResults.push(extractedText);
    }

    const problemText = ocrResults.join("\n");
    console.log("AWS Textract extraction successful. Extracted text:", 
      problemText.substring(0, 100) + (problemText.length > 100 ? "..." : ""));
    
    res.json({ problemText });
  } catch (error) {
    console.error("Text extraction error:", error);
    res.status(500).json({ 
      error: "Text extraction failed", 
      details: error.message 
    });
  } finally {
    // Clean up temporary files
    tempFiles.forEach(file => {
      try {
        fs.unlinkSync(file);
      } catch (err) {
        console.error(`Failed to delete temporary file ${file}:`, err);
      }
    });
  }
});

// --- Generation Endpoint using Groq for Chat Completions ---
// Modify the /api/generate endpoint in your server (paste-2.txt)
app.post("/api/generate", async (req, res) => {
  try {
    const { problemText, language } = req.body;
    console.log("Generate endpoint called with:", {
      languageRequested: language,
      problemTextLength: problemText ? problemText.length : 0,
      problemTextPreview: problemText ? problemText.substring(0, 100) + (problemText.length > 100 ? "..." : "") : "none"
    });
    
    if (!problemText) {
      return res.status(400).json({ error: "No problem text provided" });
    }
    
    const lang = language || "python";
    console.log(`Generating solution in ${lang}`);
    
    // Construct the message for the chat completion with specific formatting instructions
    const messages = [
      {
        role: "user",
        content: `Solve the following problem in ${lang}:\n${problemText}\n
        IMPORTANT: Provide a COMPLETELY ORIGINAL, PLAGIARISM-FREE solution. DO NOT copy existing solutions from websites, forums, or code repositories.
        
        Create a solution that demonstrates deep understanding of the problem and uses appropriate algorithms and data structures.
        
        Provide your solution in the following JSON format:
        {
          "code": "your complete original code solution here",
          "thoughts": ["thought 1", "thought 2", "thought 3"], 
          "time_complexity": "O(n) explanation here",
          "space_complexity": "O(n) explanation here"
        }
        
        The response MUST be valid JSON. Make sure to escape any special characters in strings properly.`,
      },
    ];

    console.log("Calling Groq API...");
    
    // Create a chat completion with streaming disabled to get full response
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "qwen-2.5-coder-32b",
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 0.95,
      stream: false, // Change to non-streaming
      stop: null,
    });

    console.log("Groq API call successful");
    
    // Get the full response
    const fullResponse = chatCompletion.choices[0].message.content;
    
    // Extract JSON from the response (handling potential text before/after JSON)
    let jsonResponse;
    try {
      // Find JSON in the response text (looking for opening and closing braces)
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: parse the entire response as JSON
        jsonResponse = JSON.parse(fullResponse);
      }
      
      // Ensure required fields exist
      jsonResponse = {
        code: jsonResponse.code || "",
        thoughts: Array.isArray(jsonResponse.thoughts) ? jsonResponse.thoughts : ["No specific thoughts provided"],
        time_complexity: jsonResponse.time_complexity || "Not specified",
        space_complexity: jsonResponse.space_complexity || "Not specified"
      };
      
      res.json(jsonResponse);
    } catch (error) {
      console.error("Error parsing JSON from model response:", error);
      
      // Fallback: If JSON parsing fails, create a structured response from text
      const fallbackResponse = {
        code: fullResponse.replace(/```[\w]*\n([\s\S]*?)```/g, "$1").trim() || fullResponse,
        thoughts: ["Automatically extracted from unstructured response"],
        time_complexity: "Could not determine from response",
        space_complexity: "Could not determine from response"
      };
      
      res.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: "Generation failed", details: error.message });
  }
});

// --- Debug Endpoint using Groq for Chat Completions ---
// Modify the /api/debug endpoint similarly
app.post("/api/debug", async (req, res) => {
  try {
    const { problemText, language } = req.body;
    console.log("Debug endpoint called with:", {
      languageRequested: language,
      problemTextLength: problemText ? problemText.length : 0,
      problemTextPreview: problemText ? problemText.substring(0, 100) + (problemText.length > 100 ? "..." : "") : "none"
    });
    
    if (!problemText) {
      return res.status(400).json({ error: "No problem text provided" });
    }
    
    const lang = language || "python";
    console.log(`Debugging problem in ${lang}`);
    
    const messages = [
      {
        role: "user",
        content: `Debug the following problem in ${lang}:\n${problemText}\n
        IMPORTANT: Provide a COMPLETELY ORIGINAL, PLAGIARISM-FREE solution. DO NOT copy existing solutions from websites, forums, or code repositories.
        
        Create a solution that demonstrates deep understanding of the problem and uses appropriate algorithms and data structures.
        
        Provide your solution in the following JSON format:
        {
          "code": "your complete original code solution here",
          "thoughts": ["debug observation 1", "debug observation 2", "debug observation 3"], 
          "time_complexity": "O(n) explanation here",
          "space_complexity": "O(n) explanation here"
        }
        
        The response MUST be valid JSON. Make sure to escape any special characters in strings properly.`,
      },
    ];

    console.log("Calling Groq API for debugging...");
    
    // Use non-streaming response
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "qwen-2.5-coder-32b",
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 0.95,
      stream: false,
      stop: null,
    });

    console.log("Groq API debug call successful");
    
    // Get the full response
    const fullResponse = chatCompletion.choices[0].message.content;
    
    // Extract JSON from the response (handling potential text before/after JSON)
    let jsonResponse;
    try {
      // Find JSON in the response text
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: parse the entire response as JSON
        jsonResponse = JSON.parse(fullResponse);
      }
      
      // Ensure required fields exist
      jsonResponse = {
        code: jsonResponse.code || "",
        thoughts: Array.isArray(jsonResponse.thoughts) ? jsonResponse.thoughts : ["No specific debug observations provided"],
        time_complexity: jsonResponse.time_complexity || "Not specified",
        space_complexity: jsonResponse.space_complexity || "Not specified"
      };
      
      res.json(jsonResponse);
    } catch (error) {
      console.error("Error parsing JSON from model response:", error);
      
      // Fallback: If JSON parsing fails, create a structured response from text
      const fallbackResponse = {
        code: fullResponse.replace(/```[\w]*\n([\s\S]*?)```/g, "$1").trim() || fullResponse,
        thoughts: ["Automatically extracted from unstructured debug response"],
        time_complexity: "Could not determine from response",
        space_complexity: "Could not determine from response"
      };
      
      res.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: "Debug generation failed", details: error.message });
  }
});

// Add a test endpoint to verify Groq API connectivity
app.get("/api/test-groq", async (req, res) => {
  try {
    console.log("Testing Groq API connection...");
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Hello, can you respond with just the text 'Groq API is working'?" }],
      model: "qwen-2.5-coder-32b",
      max_completion_tokens: 10,
      temperature: 0,
    });
    
    console.log("Groq API test response:", completion.choices[0].message.content);
    res.json({ status: "success", message: completion.choices[0].message.content });
  } catch (error) {
    console.error("Groq API test error:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port} at ${new Date().toISOString()}`);
  console.log(`API endpoints available:
  - POST /api/extract - Extract text from images
  - POST /api/generate - Generate solutions from problem text
  - POST /api/debug - Debug code problems
  - GET /api/test-groq - Test Groq API connectivity`);
});