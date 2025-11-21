
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Message, Persona, GradingResult, Sender, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

// --- System Instructions ---

const getPersonaInstruction = (lang: Language) => `
You are an expert at creating realistic user personas for "The Mom Test" training.
Create a persona with a HIDDEN depth.
1. **Surface:** They have a role and a vague problem.
2. **The Gold (Hidden):** They have a very specific, often messy "Detailed Workflow" they use right now to solve it. They also have a specific "Emotional Trigger" (e.g., they hate using Excel because they lost data once).

**CRITICAL:**
- The 'detailedWorkflow' must be a concrete story (e.g., "Every Friday I print the PDF, highlight it, scan it, and email it to Bob").
- The 'emotionalTrigger' is the real pain point.

Output language: ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
`;

const getGreetingInstruction = (lang: Language) => `
You are acting as a specific persona. 
Start the conversation naturally. 
**Crucial:** Hint at your surface-level situation ("I'm just finishing up some paperwork"), but DO NOT reveal your deep workflow or specific emotional triggers yet.
Be casual and brief.
Output language: ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
`;

const getChatInstruction = (lang: Language) => `
You are a roleplay engine for "The Mom Test".
You are acting as: {{PERSONA_JSON}}

**BEHAVIOR RULES (STRICT):**

1. **GENERAL/FUTURE QUESTIONS** (e.g., "How do you usually...?", "Would you like...?", "Is X hard?"):
   - **RESPONSE:** Be vague, brief, and polite. Use < 20 words. Give generic answers ("It's okay", "I usually just manage").
   - **REASON:** People don't give good data to generic questions.

2. **SPECIFIC/PAST/WORKFLOW QUESTIONS** (e.g., "Walk me through the last time...", "How exactly did you fix it yesterday?", "What happened next?"):
   - **RESPONSE:** Open up! Tell the specific story defined in your 'detailedWorkflow'. Reveal your 'emotionalTrigger'. Talk about the specific tools, costs, and frustrations.
   - **REASON:** Specific questions unlock the truth.

3. **PITCHING** (e.g., "I have an app that..."):
   - **RESPONSE:** Give a "False Positive". Say "That sounds nice" or "I'd try it", but show no real commitment.

4. **Output Language:** ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.

**Analysis Role:**
Also provide a critique of the user's question.
- **Score (0-100):** Rate the question based on The Mom Test. 100 = Specific/Past/Digging. 0 = Pitching/Future/Generic.
- **Better Alternative:** Provide the PERFECT Mom Test question the user *should* have asked in this specific context.
`;

const getGradingInstruction = (lang: Language) => `
Analyze this conversation based on "The Mom Test".
Determine if the user "CLEARED THE LEVEL".

**Win Condition (isLevelCleared = true):**
1. The user successfully uncovered the **detailedWorkflow** or **emotionalTrigger** (The hidden truth).
2. The user identified the REAL pain point, not just the surface one.
3. The user proposed a relevant next step/solution based on that truth (Commitment).

**Scoring Rubric:**
- **Past vs Future:** +20 for asking for specific stories. -20 for "Would you...".
- **Digging:** +20 for "Why?" and following up on the workflow. -10 for accepting generic answers.
- **No Pitching:** -30 for early pitching.
- **Commitment:** +20 for asking for a deposit, time, or intro.

Output language: ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
`;

const getHintInstruction = (lang: Language) => `
You are a "Mom Test" Coach.
Read the conversation history and the Persona's hidden context.
Suggest the SINGLE BEST question the user should ask right now to uncover the hidden workflow or emotional trigger.
The question must be specific, about the past, and non-pitchy.
Output only the question text.
Output language: ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
`;

// --- Schemas ---

const personaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    role: { type: Type.STRING },
    problem: { type: Type.STRING, description: "Surface level problem statement." },
    currentSolution: { type: Type.STRING, description: "Surface level workaround." },
    context: { type: Type.STRING, description: "Brief context about their situation." },
    detailedWorkflow: { type: Type.STRING, description: "The HIDDEN truth. A specific step-by-step story of what they actually do. Contains the real pain." },
    emotionalTrigger: { type: Type.STRING, description: "The specific thing that makes them angry/sad/frustrated in that workflow." },
  },
  required: ["name", "role", "problem", "currentSolution", "context", "detailedWorkflow", "emotionalTrigger"],
};

const greetingResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    aiResponse: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        subtext: { type: Type.STRING },
      },
      required: ["text", "subtext"],
    },
  },
  required: ["aiResponse"],
};

const chatResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    userAnalysis: {
      type: Type.OBJECT,
      properties: {
        subtext: { type: Type.STRING, description: "Psychological interpretation." },
        feedback: { type: Type.STRING, description: "Critique." },
        score: { type: Type.INTEGER, description: "0-100 Score." },
        betterAlternative: { type: Type.STRING, description: "A better question to ask." },
      },
      required: ["subtext", "feedback", "score", "betterAlternative"],
    },
    aiResponse: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        subtext: { type: Type.STRING },
      },
      required: ["text", "subtext"],
    },
  },
  required: ["userAnalysis", "aiResponse"],
};

const hintResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hint: { type: Type.STRING },
  },
  required: ["hint"],
};

const gradingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    totalScore: { type: Type.INTEGER },
    isLevelCleared: { type: Type.BOOLEAN, description: "True if they found the detailedWorkflow/Real Pain AND secured a commitment." },
    levelFeedback: { type: Type.STRING, description: "Short explanation of why they won or lost." },
    summary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    lineByLineAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING },
          score: { type: Type.INTEGER },
          reason: { type: Type.STRING },
          betterAlternative: { type: Type.STRING },
        },
        required: ["originalText", "score", "reason"],
      }
    }
  },
  required: ["totalScore", "isLevelCleared", "levelFeedback", "summary", "strengths", "weaknesses", "lineByLineAnalysis"],
};

// --- Functions ---

export const generatePersona = async (lang: Language): Promise<Persona> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate a rich, layered persona.",
      config: {
        systemInstruction: getPersonaInstruction(lang),
        responseMimeType: "application/json",
        responseSchema: personaSchema,
      },
    });

    return JSON.parse(response.text || "{}") as Persona;
  } catch (error) {
    console.error("Error generating persona:", error);
    throw error;
  }
};

export const generateGreeting = async (persona: Persona, lang: Language): Promise<{ aiResponse: { text: string, subtext: string } }> => {
  try {
    const prompt = `Persona: ${JSON.stringify(persona)}`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: getGreetingInstruction(lang),
        responseMimeType: "application/json",
        responseSchema: greetingResponseSchema,
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating greeting:", error);
    throw error;
  }
}

export const generateHint = async (history: Message[], persona: Persona, lang: Language): Promise<string> => {
  try {
    const chatHistory = history.map((msg) => `${msg.sender}: ${msg.text}`).join("\n");
    const prompt = `
    Persona: ${JSON.stringify(persona)}
    History:
    ${chatHistory}
    `;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: getHintInstruction(lang),
        responseMimeType: "application/json",
        responseSchema: hintResponseSchema,
      },
    });
    const result = JSON.parse(response.text || "{}");
    return result.hint || "";
  } catch (error) {
    console.error("Error generating hint:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  history: Message[],
  userMessage: string,
  persona: Persona,
  lang: Language
): Promise<{ userAnalysis: any; aiResponse: any }> => {
  try {
    const chatHistory = history.map((msg) => ({
      role: msg.sender === Sender.USER ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Inject the detailed persona context into the prompt so the model acts specifically
    const prompt = `
    [SYSTEM NOTE: Act as this specific Persona]
    ${JSON.stringify(persona)}

    [User's Message]
    "${userMessage}"

    [Instruction]
    Respond based on the BEHAVIOR RULES defined in system instructions. 
    If the user asks a GENERAL question -> Be vague/short.
    If the user asks a SPECIFIC/WORKFLOW question -> Reveal the 'detailedWorkflow'.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: getChatInstruction(lang),
        responseMimeType: "application/json",
        responseSchema: chatResponseSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const generateGrading = async (history: Message[], persona: Persona, lang: Language): Promise<GradingResult> => {
  try {
    const conversationLog = history.map(m => `${m.sender}: ${m.text}`).join("\n");
    const prompt = `
    Persona Context (The Truth): ${JSON.stringify(persona)}
    Conversation Log:
    ${conversationLog}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: getGradingInstruction(lang),
        responseMimeType: "application/json",
        responseSchema: gradingSchema,
      },
    });

    return JSON.parse(response.text || "{}") as GradingResult;
  } catch (error) {
    console.error("Error generating grading:", error);
    throw error;
  }
};
