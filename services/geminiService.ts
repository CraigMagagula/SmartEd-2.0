import { GoogleGenAI, Type } from "@google/genai";
import type { Flashcard } from '../types';

let ai: GoogleGenAI | null = null;
let initError: Error | null = null;

try {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. AI features will be disabled.");
  }
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (e) {
  console.error("Failed to initialize GoogleGenAI:", e);
  if (e instanceof Error) {
    initError = e;
  } else {
    initError = new Error("An unknown error occurred during AI service initialization.");
  }
}

const checkService = (): GoogleGenAI => {
    if (initError) throw initError;
    if (!ai) throw new Error("AI client is not available.");
    return ai;
}

export async function getAiResponse(prompt: string, context: string): Promise<string> {
  const ai = checkService();
  const model = 'gemini-2.5-flash';

  const fullPrompt = `
You are an AI Study Buddy. Your task is to answer the user's question based *only* on the provided context.
- If the answer is in the context, provide a clear and concise answer based on that information.
- If the answer is not in the context, you MUST state: "I'm sorry, I couldn't find information about that in the provided document."
- Do not use any external knowledge.
- Do not make up information.
- Be helpful and friendly.

Here is the context from the document:
---
${context}
---

Here is the user's question:
"${prompt}"

Answer:
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });
    
    return response.text;
  } catch (error) {
    console.error(`[Gemini Service] Error generating content:`, error);
    if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
            throw new Error('The provided API key is invalid. Please check your configuration.');
        }
        throw new Error(`Failed to get response from AI: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the AI.');
  }
}

export async function getStudyCoachResponse(prompt: string): Promise<string> {
  const ai = checkService();
  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are a friendly and encouraging AI Study Coach. Your goal is to help students understand concepts, get motivated, and learn effectively. You can explain topics, provide summaries, or offer words of encouragement. Keep your tone conversational and avoid overly formal language. Your responses must be in plain text. Do not use any special formatting like markdown (e.g., no asterisks '*' or hash symbols '#'). Do not include unnecessary punctuation.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error(`[Gemini Service] Error getting study coach response:`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to get response from AI Coach: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the AI Coach.');
  }
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export async function generateQuiz(grade: string, subject: string): Promise<QuizQuestion[]> {
  const ai = checkService();
  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are an expert quiz creator for students, specializing in the South African education curriculum (CAPS). Create a comprehensive multiple-choice quiz based on the provided grade level and subject. The questions should be appropriate for the specified grade and align with the CAPS curriculum.`;

  const prompt = `Generate a multiple-choice quiz for a ${grade} student on the subject of ${subject}, following the South African education curriculum.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      quiz: {
        type: Type.ARRAY,
        description: 'An array of quiz questions.',
        items: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: 'The question text.',
            },
            options: {
              type: Type.ARRAY,
              description: 'An array of 4 possible answers (strings).',
              items: {
                type: Type.STRING,
              },
            },
            answer: {
              type: Type.STRING,
              description: 'The correct answer string, which must be one of the provided options.',
            },
          },
          required: ['question', 'options', 'answer'],
        },
      },
    },
    required: ['quiz'],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (parsed && Array.isArray(parsed.quiz)) {
        return parsed.quiz as QuizQuestion[];
    } else {
        console.error("[Gemini Service] Unexpected JSON structure:", parsed);
        throw new Error('Failed to generate a valid quiz. The AI returned an unexpected format.');
    }

  } catch (error) {
    console.error(`[Gemini Service] Error generating quiz:`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate quiz from AI: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the quiz.');
  }
}

export async function generateQuizFromContent(content: string): Promise<QuizQuestion[]> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at creating study materials. Your task is to analyze the provided text and generate a comprehensive multiple-choice quiz from it. The questions should cover the key topics and information present in the text.`;
    
    const prompt = `Based on the following text, please generate a multiple-choice quiz. Each question must have 4 options and a correct answer.

Text:
---
${content}
---
`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            quiz: {
                type: Type.ARRAY,
                description: 'An array of quiz questions.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: {
                            type: Type.STRING,
                            description: 'The question text.',
                        },
                        options: {
                            type: Type.ARRAY,
                            description: 'An array of 4 possible answers (strings).',
                            items: { type: Type.STRING },
                        },
                        answer: {
                            type: Type.STRING,
                            description: 'The correct answer string, which must be one of the provided options.',
                        },
                    },
                    required: ['question', 'options', 'answer'],
                },
            },
        },
        required: ['quiz'],
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed && Array.isArray(parsed.quiz)) {
            return parsed.quiz as QuizQuestion[];
        } else {
            console.error("[Gemini Service] Unexpected JSON structure for content quiz:", parsed);
            throw new Error('Failed to generate valid quiz from content. The AI returned an unexpected format.');
        }

    } catch (error) {
        console.error(`[Gemini Service] Error generating quiz from content:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate quiz from AI: ${error.message}`);
        }
        throw new Error('An unknown error occurred while generating the quiz.');
    }
}


export interface StudyBlock {
    day: string;
    time: string;
    task: string;
    duration: string;
}

export interface StudyPlan {
    plan: StudyBlock[];
}

export async function generateStudyPlan(availability: string[], goals: string): Promise<StudyPlan> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an expert academic planner. Your task is to create a personalized, one-week study plan for a student based on their availability and goals. The plan should be realistic, actionable, and spread out across the week.`;

    const prompt = `
        A student has the following weekly study goals: "${goals}".
        They are available to study on the following days: ${availability.join(', ')}.
        
        Create a one-week study schedule with specific tasks and estimated durations for each session.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            plan: {
                type: Type.ARRAY,
                description: 'A list of study blocks for the week.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING, description: 'Day of the week (e.g., Monday).' },
                        time: { type: Type.STRING, description: 'Time of day (e.g., Morning, 6 PM).' },
                        task: { type: Type.STRING, description: 'The specific study task.' },
                        duration: { type: Type.STRING, description: 'Estimated duration (e.g., 45 minutes).' },
                    },
                    required: ['day', 'time', 'task', 'duration'],
                },
            },
        },
        required: ['plan'],
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (parsed && Array.isArray(parsed.plan)) {
            return parsed as StudyPlan;
        } else {
            console.error("[Gemini Service] Unexpected JSON structure for study plan:", parsed);
            throw new Error('Failed to generate a valid study plan. The AI returned an unexpected format.');
        }

    } catch (error) {
        console.error(`[Gemini Service] Error generating study plan:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate study plan from AI: ${error.message}`);
        }
        throw new Error('An unknown error occurred while generating the study plan.');
    }
}

export interface FeynmanEvaluation {
    feedback: string;
    weakSpots: string[];
    clarityScore: number;
    textbookDefinition: string;
}

export async function evaluateFeynmanExplanation(concept: string, explanation: string): Promise<FeynmanEvaluation> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an expert tutor specializing in the Feynman Technique. Your task is to evaluate a student's explanation of a concept. Provide constructive feedback, identify weak spots, give a clarity score from 1-10, and provide a correct, concise 'textbook' definition.`;

    const prompt = `
        Concept: "${concept}"
        Student's Explanation: "${explanation}"

        Please evaluate the student's explanation.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            feedback: {
                type: Type.STRING,
                description: "Constructive feedback on the student's explanation, highlighting strengths and areas for improvement.",
            },
            weakSpots: {
                type: Type.ARRAY,
                description: "A list of specific points or concepts the student missed or explained incorrectly.",
                items: { type: Type.STRING },
            },
            clarityScore: {
                type: Type.INTEGER,
                description: "A score from 1 (very unclear) to 10 (perfectly clear) representing the clarity of the explanation.",
            },
            textbookDefinition: {
                type: Type.STRING,
                description: "A concise and accurate 'textbook' definition of the concept for comparison.",
            },
        },
        required: ['feedback', 'weakSpots', 'clarityScore', 'textbookDefinition'],
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (parsed && typeof parsed.feedback === 'string' && Array.isArray(parsed.weakSpots) && typeof parsed.clarityScore === 'number') {
            return parsed as FeynmanEvaluation;
        } else {
            console.error("[Gemini Service] Unexpected JSON structure for Feynman evaluation:", parsed);
            throw new Error('Failed to get a valid evaluation. The AI returned an unexpected format.');
        }

    } catch (error) {
        console.error(`[Gemini Service] Error evaluating Feynman explanation:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to get evaluation from AI: ${error.message}`);
        }
        throw new Error('An unknown error occurred while evaluating the explanation.');
    }
}


export async function generateFlashcards(text: string): Promise<Flashcard[]> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at creating study materials. Your task is to analyze the provided text and generate a concise set of flashcards from it. Each flashcard should have a clear term and a corresponding definition.`;

    const prompt = `
        Based on the following text, please generate a list of flashcards with a term and a definition for each.

        Text:
        ---
        ${text}
        ---
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            flashcards: {
                type: Type.ARRAY,
                description: 'An array of generated flashcards.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        term: { type: Type.STRING, description: 'The key term or concept.' },
                        definition: { type: Type.STRING, description: 'The definition or explanation of the term.' },
                    },
                    required: ['term', 'definition'],
                },
            },
        },
        required: ['flashcards'],
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed && Array.isArray(parsed.flashcards)) {
            return parsed.flashcards as Flashcard[];
        } else {
            console.error("[Gemini Service] Unexpected JSON structure for flashcards:", parsed);
            throw new Error('Failed to generate valid flashcards. The AI returned an unexpected format.');
        }

    } catch (error) {
        console.error(`[Gemini Service] Error generating flashcards:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate flashcards from AI: ${error.message}`);
        }
        throw new Error('An unknown error occurred while generating flashcards.');
    }
}

export interface Summary {
    summaryPoints: string[];
}

export async function summarizeText(text: string): Promise<Summary> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at text analysis and summarization. Your task is to read the provided text and distill it into a concise list of key points or bullet points. Focus on the most important information.`;
    const prompt = `Please summarize the following text into key bullet points:\n\n---\n${text}\n---`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            summaryPoints: {
                type: Type.ARRAY,
                description: 'A list of key summary points as strings.',
                items: { type: Type.STRING },
            },
        },
        required: ['summaryPoints'],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        const parsed = JSON.parse(response.text.trim());
        if (parsed && Array.isArray(parsed.summaryPoints)) {
            return parsed as Summary;
        }
        throw new Error('AI returned an unexpected format for the summary.');
    } catch (error) {
        console.error(`[Gemini Service] Error summarizing text:`, error);
        throw new Error(error instanceof Error ? `Failed to summarize text: ${error.message}` : 'An unknown error occurred during summarization.');
    }
}

export interface MindMapNode {
    topic: string;
    children?: MindMapNode[];
}

export async function generateMindMap(text: string): Promise<MindMapNode> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at creating structured learning aids. Your task is to analyze the provided text and generate a hierarchical mind map. The mind map should have a central topic and nested child topics. Keep the structure logical and the topics concise.`;
    const prompt = `Based on the following text, generate a mind map structure with a root topic and nested children.\n\n---\n${text}\n---`;
    
    const nodeSchema: any = {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING, description: 'The topic of this node.' },
        },
        required: ['topic'],
    };
    nodeSchema.properties.children = {
        type: Type.ARRAY,
        description: 'An array of child nodes.',
        items: nodeSchema
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            mindMap: nodeSchema
        },
        required: ['mindMap'],
    };
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        const parsed = JSON.parse(response.text.trim());
        if (parsed && parsed.mindMap) {
            return parsed.mindMap as MindMapNode;
        }
        throw new Error('AI returned an unexpected format for the mind map.');
    } catch (error) {
        console.error(`[Gemini Service] Error generating mind map:`, error);
        throw new Error(error instanceof Error ? `Failed to generate mind map: ${error.message}` : 'An unknown error occurred during mind map generation.');
    }
}


export async function generateQuizFromSelection(selection: string): Promise<QuizQuestion[]> {
  const ai = checkService();
  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are an expert quiz creator. Based *only* on the provided text selection, create a small multiple-choice quiz (2-4 questions) to test the user's understanding of that specific information.`;

  const prompt = `Generate a short quiz from this text selection:\n\n---\n${selection}\n---`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      quiz: {
        type: Type.ARRAY,
        description: 'An array of quiz questions.',
        items: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: 'The question text.',
            },
            options: {
              type: Type.ARRAY,
              description: 'An array of 4 possible answers (strings).',
              items: {
                type: Type.STRING,
              },
            },
            answer: {
              type: Type.STRING,
              description: 'The correct answer string, which must be one of the provided options.',
            },
          },
          required: ['question', 'options', 'answer'],
        },
      },
    },
    required: ['quiz'],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (parsed && Array.isArray(parsed.quiz)) {
        return parsed.quiz as QuizQuestion[];
    } else {
        throw new Error('Failed to generate a valid quiz from selection.');
    }

  } catch (error) {
    console.error(`[Gemini Service] Error generating quiz from selection:`, error);
     if (error instanceof Error) {
        throw new Error(`Failed to generate quiz from selection: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the quiz from selection.');
  }
}

export interface GeneratedTitleAndTags {
    title: string;
    tags: string[];
}

export async function generateTitleAndTags(content: string): Promise<GeneratedTitleAndTags> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at analyzing text. Your task is to read the provided text and generate a concise, descriptive title for it, and a list of 3-5 relevant topic tags.`;
    const prompt = `Analyze the following text and provide a title and tags.\n\nText snippet:\n---\n${content.substring(0, 4000)}\n---`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'A concise title for the document.' },
            tags: {
                type: Type.ARRAY,
                description: 'An array of 3-5 relevant topic tags.',
                items: { type: Type.STRING },
            },
        },
        required: ['title', 'tags'],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        const parsed = JSON.parse(response.text.trim());
        if (parsed && parsed.title && Array.isArray(parsed.tags)) {
            return parsed as GeneratedTitleAndTags;
        }
        throw new Error('AI returned an unexpected format for title and tags.');
    } catch (error) {
        console.error(`[Gemini Service] Error generating title and tags:`, error);
        throw new Error(error instanceof Error ? `Failed to generate title and tags: ${error.message}` : 'An unknown error occurred during title and tag generation.');
    }
}

export interface DocumentInfo {
    id: string;
    title: string;
}

export async function semanticSearch(query: string, documents: DocumentInfo[]): Promise<string[]> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a semantic search engine. Based on the user's query, find the most relevant documents from the provided list. Respond with only a JSON array of the relevant document IDs.`;

    const prompt = `
        User Query: "${query}"

        Available Documents:
        ${JSON.stringify(documents)}

        Return a JSON array of the document IDs that are most conceptually related to the user's query.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            relevant_ids: {
                type: Type.ARRAY,
                description: 'An array of document IDs that are relevant to the query.',
                items: { type: Type.STRING },
            },
        },
        required: ['relevant_ids'],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        const parsed = JSON.parse(response.text.trim());
        if (parsed && Array.isArray(parsed.relevant_ids)) {
            return parsed.relevant_ids as string[];
        }
        return [];
    } catch (error) {
        console.error(`[Gemini Service] Error during semantic search:`, error);
        // Return empty array on error to avoid breaking the UI
        return [];
    }
}

export interface PhotoSolverResponse {
    stepByStepExplanation: string[];
    finalAnswer: string;
    confidenceScore: number; // 0-100
    relatedConcepts: {
        name: string;
        query: string; 
    }[];
}

export async function solveFromImage(base64Image: string, mimeType: string): Promise<PhotoSolverResponse> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an expert tutor that helps students solve problems from images. Analyze the image provided by the user, which could be a math problem, a physics diagram, a chemistry equation, etc. Provide a detailed, step-by-step explanation of how to arrive at the solution. Conclude with the final answer. Also, provide a confidence score (0-100) indicating how sure you are about the solution, and list a few related concepts that the student might want to learn more about.`;

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: "Please solve the problem in this image.",
    };
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            stepByStepExplanation: {
                type: Type.ARRAY,
                description: "A detailed list of steps to solve the problem.",
                items: { type: Type.STRING },
            },
            finalAnswer: {
                type: Type.STRING,
                description: "The final, concise answer to the problem.",
            },
            confidenceScore: {
                type: Type.INTEGER,
                description: "A score from 0 to 100 representing your confidence in the correctness of the solution.",
            },
            relatedConcepts: {
                type: Type.ARRAY,
                description: "A list of related concepts for further study.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The name of the concept (e.g., 'Linear Equations')." },
                        query: { type: Type.STRING, description: "A search query for the concept (e.g., 'what are linear equations')." },
                    },
                    required: ['name', 'query'],
                },
            },
        },
        required: ['stepByStepExplanation', 'finalAnswer', 'confidenceScore', 'relatedConcepts'],
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed && Array.isArray(parsed.stepByStepExplanation)) {
            return parsed as PhotoSolverResponse;
        } else {
            throw new Error("The AI returned an unexpected format for the photo solution.");
        }

    } catch (error) {
        console.error(`[Gemini Service] Error solving from image:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to get solution from AI: ${error.message}`);
        }
        throw new Error('An unknown error occurred while solving the problem.');
    }
}

// New Types for YouTube Search
export interface YouTubeVideo {
    videoId: string;
    title: string;
    channelName: string;
}

export interface VideoSummary {
    tldr: string;
    keyPoints: string[];
}

const getYouTubeIdFromUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;

    let videoId: string | null = null;
    
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        if (hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1).split('?')[0];
        } else if (hostname.includes('youtube.com')) {
            if (urlObj.pathname.startsWith('/embed/')) {
                videoId = urlObj.pathname.split('/')[2].split('?')[0];
            } else if (urlObj.searchParams.has('v')) {
                videoId = urlObj.searchParams.get('v');
            }
        }
    } catch (e) {
        // This block will be entered if the URL is malformed.
        // The regex fallback below will attempt to parse it.
    }
    
    // Regex fallback for all other cases (including malformed URLs that failed the URL constructor)
    if (!videoId) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        if (match && match[1]) {
            videoId = match[1];
        }
    }

    // Ensure we have a valid 11-character ID. Return null if not.
    return videoId && videoId.length === 11 ? videoId : null;
};

export async function searchEducationalVideos(query: string): Promise<YouTubeVideo[]> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a helpful assistant that finds educational YouTube videos. Your goal is to return high-quality, relevant, and safe-for-all-ages educational content based on the user's query. You must only use the Google Search tool.`;

    const prompt = `
        Find 12 relevant and high-quality educational YouTube videos about "${query}". 
        Focus on videos from well-known educational channels or creators.
        
        You MUST respond with ONLY a JSON object containing a key "videos" which is an array of video objects. Do not include any other text, explanation, or markdown formatting. Each object in the array must have the following properties: "videoUrl", "title", and "channelName".
        The "videoUrl" MUST be a direct and valid link to a YouTube video (e.g., "https://www.youtube.com/watch?v=...").
        
        Example response format:
        {
          "videos": [
            {
              "videoUrl": "https://www.youtube.com/watch?v=some_id_123",
              "title": "A Great Educational Video Title",
              "channelName": "Education Channel"
            }
          ]
        }
    `;

    interface YouTubeVideoWithUrl {
        videoUrl: string;
        title: string;
        channelName: string;
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });
        
        let jsonString = response.text.trim();
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7);
        }
        if (jsonString.endsWith('```')) {
            jsonString = jsonString.slice(0, -3);
        }

        const parsed = JSON.parse(jsonString);

        if (parsed && Array.isArray(parsed.videos)) {
            const videosWithUrls = parsed.videos as YouTubeVideoWithUrl[];
            
            const processedVideos: YouTubeVideo[] = videosWithUrls
                .map(video => {
                    const videoId = getYouTubeIdFromUrl(video.videoUrl);
                    if (!videoId) {
                        console.warn(`Could not extract videoId from URL: ${video.videoUrl}`);
                        return null;
                    }
                    return {
                        videoId,
                        title: video.title,
                        channelName: video.channelName,
                    };
                })
                .filter((video): video is YouTubeVideo => video !== null);

            if (processedVideos.length === 0 && videosWithUrls.length > 0) {
                 throw new Error("AI returned video data, but video IDs could not be extracted from the URLs.");
            }
            
            return processedVideos;
        } else {
            console.error("[Gemini Service] Unexpected JSON structure for video search:", parsed);
            throw new Error('Failed to find videos. The AI returned an unexpected format.');
        }

    } catch (error) {
        console.error(`[Gemini Service] Error searching educational videos:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to search videos via AI: ${error.message}`);
        }
        throw new Error('An unknown error occurred while searching for videos.');
    }
}

export async function generateVideoSummary(videoTitle: string): Promise<VideoSummary> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at summarizing educational content. Your task is to provide a concise summary and a list of key learning points based on the title of a YouTube video.`;
    
    const prompt = `Generate a TL;DR (Too Long; Didn't Read) summary and 3-5 key learning points for a video titled: "${videoTitle}". The summary should be a short paragraph, and the key points should be brief, one-sentence bullet points.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            tldr: {
                type: Type.STRING,
                description: "A short, one-paragraph summary of the likely video content.",
            },
            keyPoints: {
                type: Type.ARRAY,
                description: "A list of 3-5 key learning points from the video.",
                items: { type: Type.STRING },
            },
        },
        required: ['tldr', 'keyPoints'],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        const parsed = JSON.parse(response.text.trim());
        if (parsed && parsed.tldr && Array.isArray(parsed.keyPoints)) {
            return parsed as VideoSummary;
        }
        throw new Error('AI returned an unexpected format for the video summary.');
    } catch (error) {
        console.error(`[Gemini Service] Error generating video summary:`, error);
        throw new Error(error instanceof Error ? `Failed to summarize video: ${error.message}` : 'An unknown error occurred during summarization.');
    }
}

export async function generateQuizFromVideo(videoTitle: string): Promise<QuizQuestion[]> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at creating study materials from video content. Based on the video's title, generate a multiple-choice quiz that tests understanding of the likely topics covered in the video.`;

    const prompt = `Based on a video titled "${videoTitle}", please generate a multiple-choice quiz with 5 questions. Each question must have 4 options and a correct answer.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            quiz: {
                type: Type.ARRAY,
                description: 'An array of 5 quiz questions.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING, description: 'The question text.' },
                        options: {
                            type: Type.ARRAY,
                            description: 'An array of 4 possible answers (strings).',
                            items: { type: Type.STRING },
                        },
                        answer: { type: Type.STRING, description: 'The correct answer, which must be one of the options.' },
                    },
                    required: ['question', 'options', 'answer'],
                },
            },
        },
        required: ['quiz'],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });

        const parsed = JSON.parse(response.text.trim());
        if (parsed && Array.isArray(parsed.quiz)) {
            return parsed.quiz as QuizQuestion[];
        }
        throw new Error('AI returned an unexpected format for the video quiz.');
    } catch (error) {
        console.error(`[Gemini Service] Error generating quiz from video:`, error);
        throw new Error(error instanceof Error ? `Failed to generate quiz: ${error.message}` : 'An unknown error occurred.');
    }
}

export interface PastPaperResult {
    name: string;
    type: 'Question Paper' | 'Memorandum' | 'Answer Book';
    url: string;
}

export async function searchPastPapers(subject: string, year: string): Promise<PastPaperResult[]> {
    const ai = checkService();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert search assistant for South African educational materials. You only respond with JSON. Do not include any text outside of the JSON block.`;

    const prompt = `
        Find official NSC (National Senior Certificate) past examination papers and memorandums for the subject "${subject}" from the year "${year}".
        Prioritize links from the "education.gov.za" domain.
        You MUST return a JSON object with a single key "papers". The value should be an array of objects.
        Each object must have the following keys:
        - "name": A descriptive name, e.g., "Mathematics Paper 1".
        - "type": Can be "Question Paper", "Memorandum", or "Answer Book".
        - "url": The direct, full URL to the PDF file.

        Example response format:
        \`\`\`json
        {
          "papers": [
            {
              "name": "Mathematics Paper 1",
              "type": "Question Paper",
              "url": "https://www.education.gov.za/some-path/math-p1-nov2022-en.pdf"
            },
            {
              "name": "Mathematics Paper 1 Memo",
              "type": "Memorandum",
              "url": "https://www.education.gov.za/some-path/math-p1-memo-nov2022-en.pdf"
            }
          ]
        }
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonString = response.text.trim();
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7);
        }
        if (jsonString.endsWith('```')) {
            jsonString = jsonString.slice(0, -3);
        }
        
        const parsed = JSON.parse(jsonString);

        if (parsed && Array.isArray(parsed.papers)) {
            return parsed.papers as PastPaperResult[];
        } else {
            throw new Error("AI returned an unexpected format for past papers.");
        }

    } catch (error) {
        console.error(`[Gemini Service] Error searching past papers:`, error);
        if (error instanceof Error) {
             throw new Error(`Failed to get past papers from AI: ${error.message}`);
        }
        throw new Error('An unknown error occurred while searching for past papers.');
    }
}
