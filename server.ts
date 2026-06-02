/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI client (safe lazy loading)
let aiClient: GoogleGenAI | null = null;
const api_key = process.env.GEMINI_API_KEY;

if (api_key && api_key !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: api_key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("GoogleGenAI client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found or using placeholder. Running in local fallback mode.");
}

// Local Activities Database for Fallback or Hybrid Suggestions
interface LocalActivity {
  activity: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpValue: number;
}

const LOCAL_ACTIVITIES: Record<string, LocalActivity[]> = {
  "chess": [
    {
      activity: "Solve 5 Tactical Puzzles",
      description: "Log into a chess puzzle platform (or imagine scenarios) and solve 5 rated puzzles focusing on forks, pins, and skewers.",
      difficulty: "Intermediate",
      estimatedMinutes: 15,
      xpValue: 30
    },
    {
      activity: "Study Grandmaster Endgame Patterns",
      description: "Analyze a famous rook and pawn endgame pattern. Focus on the concept of 'opposition' and key square control.",
      difficulty: "Advanced",
      estimatedMinutes: 25,
      xpValue: 50
    },
    {
      activity: "Play & Self-Analyze 1 Rapid Game",
      description: "Play a 10-minute chess game. Win or lose, spend 10 minutes reviewing your moves without an engine first to spot bladder blunders.",
      difficulty: "Intermediate",
      estimatedMinutes: 25,
      xpValue: 40
    },
    {
      activity: "Review opening fundamentals",
      description: "Read or review the 3 golden chess opening principles: control the center, develop knights/bishops, and castle early.",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      xpValue: 20
    }
  ],
  "music": [
    {
      activity: "Practice Progression in 3 Keys",
      description: "Choose a 4-chord progression (e.g., I-V-vi-IV). Practice playing it smoothly across three different keys on your instrument.",
      difficulty: "Intermediate",
      estimatedMinutes: 15,
      xpValue: 30
    },
    {
      activity: "Attempt to Play a Melody by Ear",
      description: "Listen to a simple song or nursery rhyme, then try to find the notes on your keyboard or guitar purely by ear.",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      xpValue: 20
    },
    {
      activity: "Synthesizer Sound Design Experiment",
      description: "Open any soft synth and build a warm ambient pad from scratch. Use dual detuned saw wave oscillators and a low pass filter.",
      difficulty: "Advanced",
      estimatedMinutes: 30,
      xpValue: 50
    },
    {
      activity: "Active Listening of a Unfamiliar Genre",
      description: "Pick a song from a genre you rarely listen to (e.g., Bebop, Shoegaze, Baroque). Write down 3 distinct stylistic details you notice.",
      difficulty: "Beginner",
      estimatedMinutes: 15,
      xpValue: 25
    }
  ],
  "reading": [
    {
      activity: "Read One Chapter of Non-fiction",
      description: "Read a chapter of an educational book. Highlight 2 key arguments or concepts you can apply to your personal life.",
      difficulty: "Beginner",
      estimatedMinutes: 20,
      xpValue: 30
    },
    {
      activity: "Write a Concise Article Summary",
      description: "Find an online editorial or research paper. Read it thoroughly and summarize its core theme in exactly 3 bullet points.",
      difficulty: "Intermediate",
      estimatedMinutes: 15,
      xpValue: 25
    },
    {
      activity: "Explore Classic Poetry Loudly",
      description: "Select 2 classical poems. Read them aloud twice with deliberate pauses, listening closely to the rhythm, tone, and meter.",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      xpValue: 15
    },
    {
      activity: "Read an In-depth Biography Snippet",
      description: "Read a 10-page biographical article about a historic leader or scientist. Extract 1 core growth principle they lived by.",
      difficulty: "Intermediate",
      estimatedMinutes: 20,
      xpValue: 35
    }
  ],
  "programming": [
    {
      activity: "Solve an Easy Coding Kata",
      description: "Head to a coding platform and solve an algorithmic task. Focus on clean coding habits: descriptive variables and comments.",
      difficulty: "Beginner",
      estimatedMinutes: 15,
      xpValue: 25
    },
    {
      activity: "Refactor a Legacy Script Block",
      description: "Open a previous code project. Identify a helper function or complex conditional and simplify it down to 5 fewer lines.",
      difficulty: "Intermediate",
      estimatedMinutes: 20,
      xpValue: 40
    },
    {
      activity: "Draft a Web App Database Schema",
      description: "Pick an app idea and draw its database ERD (Entity Relationship Diagram). List collections, properties, and relationships.",
      difficulty: "Advanced",
      estimatedMinutes: 30,
      xpValue: 50
    }
  ],
  "fitness": [
    {
      activity: "Do a 15 min Core Dynamic Yoga Loop",
      description: "Follow a sequence of downward dogs, planks, cobras, and warriors. Hold each pose for 5 deep breaths, focusing on core engagement.",
      difficulty: "Beginner",
      estimatedMinutes: 15,
      xpValue: 25
    },
    {
      activity: "High-Intensity Bodyweight Interval",
      description: "Do 3 rounds of: 10 burpees, 15 squats, 15 pushups, and 30-sec plank. Rest for 1 minute between rounds.",
      difficulty: "Intermediate",
      estimatedMinutes: 15,
      xpValue: 35
    },
    {
      activity: "Box-Breathing Active Walk",
      description: "Walk briskly outdoors. Coordinate your breathing to your steps: inhale for 4 steps, hold for 4, exhale for 4, hold for 4.",
      difficulty: "Beginner",
      estimatedMinutes: 20,
      xpValue: 25
    }
  ],
  "generic": [
    {
      activity: "Organize Your Desk Space",
      description: "Clear all visual clutter from your immediate workstation. Wipe down the surface to prepare your mind for focused effort.",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      xpValue: 15
    },
    {
      activity: "Journal Daily Reflection",
      description: "Write down 3 things that went well today, 1 thing you learned, and 1 specific action to work on tomorrow.",
      difficulty: "Beginner",
      estimatedMinutes: 12,
      xpValue: 20
    }
  ]
};

// API - Generate recommendations using Gemini if active, or local database
app.post("/api/recommend", async (req, res) => {
  const { user, logs } = req.body;
  if (!user || !user.interests || user.interests.length === 0) {
    return res.status(400).json({ error: "Invalid user data or no interests selected." });
  }

  const interestsList = user.interests;
  const goalsList = user.goals || [];

  if (aiClient) {
    try {
      const prompt = `You are a professional Personal Growth Mentor. Based on the user's profile, recommend 3 concrete growth activities corresponding to their interests.
User Profile:
- Name: ${user.name}
- Age: ${user.age}
- Selected Interests: ${interestsList.join(", ")}
- Growth Goals: ${goalsList.join(", ")}
- Level: ${user.level} (XP: ${user.xp})
- Recent completions: ${logs ? logs.slice(-3).map((l: any) => l.activity).join(", ") : "None yet"}

Output strictly a JSON array. Each element in the array MUST match the following JSON schema:
[
  {
    "id": "string (unique string)",
    "activity": "string (concise activity title)",
    "interest": "string (MUST be one of: ${interestsList.join(", ")})",
    "description": "string (detailed, actionable instructions on how to complete it)",
    "difficulty": "Beginner" | "Intermediate" | "Advanced",
    "estimatedMinutes": number,
    "xpValue": number (between 15 and 60)
  }
]
Output only the raw JSON. No markdown backticks, no text outside the JSON array. Ensure the interest exactly matches one of the user's selection interests.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                activity: { type: Type.STRING },
                interest: { type: Type.STRING, description: `Must be one of the selected user interests` },
                description: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
                estimatedMinutes: { type: Type.INTEGER },
                xpValue: { type: Type.INTEGER }
              },
              required: ["id", "activity", "interest", "description", "difficulty", "estimatedMinutes", "xpValue"]
            }
          }
        }
      });

      const responseText = response.text || "";
      const generatedList = JSON.parse(responseText.trim());
      if (Array.isArray(generatedList) && generatedList.length > 0) {
        return res.json({ source: "AI", recommendations: generatedList });
      }
    } catch (error) {
      console.error("Gemini suggestion failed, falling back to local recommendations:", error);
    }
  }

  // Fallback Local recommendation generation
  const recommendations: any[] = [];
  const selectedInterests = [...interestsList];
  
  // If user has no interests or just one, fill with some generic
  if (selectedInterests.length === 0) {
    selectedInterests.push("generic");
  }

  for (let i = 0; i < 3; i++) {
    const interest = selectedInterests[i % selectedInterests.length];
    const choices = LOCAL_ACTIVITIES[interest.toLowerCase()] || LOCAL_ACTIVITIES["generic"];
    const randomIndex = Math.floor(Math.random() * choices.length);
    const activityTemplate = choices[randomIndex];

    recommendations.push({
      id: `local_${interest}_${Date.now()}_${i}`,
      activity: activityTemplate.activity,
      interest: interest,
      description: activityTemplate.description,
      difficulty: activityTemplate.difficulty,
      estimatedMinutes: activityTemplate.estimatedMinutes,
      xpValue: activityTemplate.xpValue
    });
  }

  return res.json({ source: "Local Engine", recommendations });
});

// API - Chat Assistant (AI Growth Coach)
app.post("/api/chat", async (req, res) => {
  const { messages, user, logs } = req.body;
  
  if (!messages || !user) {
    return res.status(400).json({ error: "Missing required fields (messages, user)." });
  }

  const latestMessage = messages[messages.length - 1];
  const userText = latestMessage.text;

  // Compile some history logs to inform the AI of their progress
  const recentLogsText = logs && logs.length > 0
    ? logs.slice(-5).map((l: any) => `- Completed "${l.activity}" (${l.interest}) at ${l.timestamp.split("T")[0]} earning ${l.xpEarned}XP`).join("\n")
    : "No completed activities logged yet.";

  // Define fallback response mechanism in case Gemini isn't available
  if (!aiClient) {
    let fallbackText = "How can I help you grow today?";
    const textLower = userText.toLowerCase();

    if (textLower.includes("goal")) {
      fallbackText = `Your active goals are: ${user.goals && user.goals.length > 0 ? user.goals.join(", ") : "none defined yet"}. We are working together to accomplish these milestone by milestone. Is there one you are practicing today?`;
    } else if (textLower.includes("interest")) {
      fallbackText = `Your selected skills/interests are: ${user.interests && user.interests.length > 0 ? user.interests.join(", ") : "none defined yet"}. I can suggest custom puzzles, exercises, or tutorials for these. Which would you like to level up?`;
    } else if (textLower.includes("streak") || textLower.includes("progress")) {
      fallbackText = `You are on a ${user.streak}-day streak with a current Level of ${user.level} (Total XP: ${user.xp}). Consistency is key! I recommend completing today's suggested action to keep the spark alive.`;
    } else {
      fallbackText = `Hello ${user.name}! As your local Growth Guide, I recommend working on your active skills like ${user.interests && user.interests.length > 0 ? user.interests[0] : "chess/music"}. Keep making progress, logging your daily trials, and checking achievements! Let me know if you want detailed steps for any exercises.`;
    }

    return res.json({
      text: fallbackText,
      source: "Local Mentor AI"
    });
  }

  try {
    // Generate context-aware prompts in correct dialog format
    const chatHistory = messages.slice(0, -1).map((msg: any) => {
      return {
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      };
    });

    const systemInstruction = `You are a supportive, insightful, and strategic AI Personal Growth Coach.
The user is ${user.name} (Age: ${user.age}).
Selected Skills/Interests: ${user.interests.join(", ")}
Core Growth Goals: ${user.goals.join(", ")}
Level: ${user.level} (Streak: ${user.streak} days, total XP: ${user.xp})

Logged completion history:
${recentLogsText}

Instructions:
- Give positive, actionable coaching advice. Focus on deliberate practice, cognitive routines, and consistency.
- Keep responses brief, scannable, and motivational (max 150 words).
- If the user asks about their goals or interests, speak directly about details from their profile.
- Ground advice in practical learning frameworks (e.g. solving tactical patterns for chess, incremental interval drills for music, summaries for reading).
- Adopt a warm, human-to-human verbal coach presence. Give concrete, quick tips.`;

    // Call Gemini API utilising the SDK
    const contents = [...chatHistory, { role: 'user', parts: [{ text: userText }] }] as any;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.8,
        topP: 0.95
      }
    });

    return res.json({
      text: response.text || "I'm processing your goals. Daily action is the path to mastery. What shall we achieve next?",
      source: "Gemini Growth Coach"
    });
  } catch (error) {
    console.error("Gemini chat error:", error);
    return res.json({
      text: `Nice to meet you! I had a slight hiccup contacting my advanced neural center, but I am still here to help! Let's focus on your interest in ${user.interests && user.interests.length > 0 ? user.interests[0] : "Chess & Music"}. Continuous practice creates permanent pathways!`,
      source: "Local Backup Coach"
    });
  }
});

// Serve frontend assets in production / development
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
};

startServer();
