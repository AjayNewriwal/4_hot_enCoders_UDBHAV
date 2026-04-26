// @ts-ignore: Deno URL imports are valid in the Supabase runtime but not in local Node/Vite TS config
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Fallback questions used when AI fails ─────────────────────────────────────
function fallbackQuestions(skill: string) {
  return {
    questions: [
      {
        type: "mcq",
        question: `What is the time complexity of binary search in a sorted array?`,
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correct: "O(log n)"
      },
      {
        type: "mcq",
        question: `Which data structure uses LIFO (Last In First Out) order?`,
        options: ["Queue", "Array", "Stack", "Linked List"],
        correct: "Stack"
      },
      {
        type: "mcq",
        question: `In ${skill}, what does DRY stand for?`,
        options: ["Don't Repeat Yourself", "Do Run Yesterday", "Data Returns You", "Declare Render Yield"],
        correct: "Don't Repeat Yourself"
      },
      {
        type: "mcq",
        question: `Which sorting algorithm has the best average time complexity?`,
        options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
        correct: "Merge Sort"
      },
      {
        type: "mcq",
        question: `What is the space complexity of a recursive Fibonacci function without memoization?`,
        options: ["O(1)", "O(n)", "O(log n)", "O(2^n)"],
        correct: "O(n)"
      },
      {
        type: "mcq",
        question: `Which of the following is NOT a valid HTTP method?`,
        options: ["GET", "POST", "FETCH", "DELETE"],
        correct: "FETCH"
      },
      {
        type: "mcq",
        question: `What does SQL stand for?`,
        options: ["Structured Query Language", "Sequential Query Logic", "Simple Query List", "Standard Query Language"],
        correct: "Structured Query Language"
      },
      {
        type: "mcq",
        question: `Which principle states that a class should have only one reason to change?`,
        options: ["Open/Closed", "Single Responsibility", "Liskov Substitution", "Dependency Inversion"],
        correct: "Single Responsibility"
      },
      {
        type: "mcq",
        question: `In Big-O notation, O(1) means:`,
        options: ["Linear time", "Logarithmic time", "Constant time", "Quadratic time"],
        correct: "Constant time"
      },
      {
        type: "mcq",
        question: `Which data structure is used to implement BFS (Breadth First Search)?`,
        options: ["Stack", "Queue", "Heap", "Tree"],
        correct: "Queue"
      },
      {
        type: "fill",
        question: `The process of dividing a problem into smaller subproblems of the same type is called ________.`,
        answer: "recursion"
      },
      {
        type: "fill",
        question: `A ________ is a data structure where each node points to the next node in the sequence.`,
        answer: "linked list"
      },
      {
        type: "fill",
        question: `The CSS property used to control the stacking order of elements is called ________.`,
        answer: "z-index"
      },
      {
        type: "fill",
        question: `In object-oriented programming, hiding implementation details is called ________.`,
        answer: "encapsulation"
      },
      {
        type: "fill",
        question: `The programming paradigm that treats computation as the evaluation of mathematical functions is ________ programming.`,
        answer: "functional"
      }
    ]
  };
}

// ── Extract JSON safely from AI response ──────────────────────────────────────
function extractJSON(raw: string): any | null {
  // Remove markdown code fences
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Try extracting first {...} block
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.substring(start, end + 1));
    } catch (_) {}
  }

  return null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const mode = body?.mode;         // "skill-test" | undefined (legacy)
    const skill = body?.skill || "DSA";
    const difficultyRaw = body?.difficulty;

    // @ts-ignore: Deno is available in Supabase Edge runtime
    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      console.error("GROQ_API_KEY missing");
      // Return fallback instead of erroring
      return new Response(JSON.stringify(fallbackQuestions(skill)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── MODE: skill-test → generate 15 MCQ + fill questions ──────────────────
    if (mode === "skill-test") {
      const prompt = `You are a strict JSON generator for a skill verification test.

Generate exactly 15 questions about "${skill}":
- 10 multiple choice questions (type: "mcq")
- 5 fill-in-the-blank questions (type: "fill")

STRICT RULES:
- Return ONLY valid JSON. No markdown, no explanation, no extra text, no code fences.
- Every MCQ must have exactly 4 options and a correct answer that exactly matches one option.
- Every fill question must have a short, single-word or short-phrase answer.

Return this exact structure:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Option A"
    },
    {
      "type": "fill",
      "question": "The ___ is used to store key-value pairs.",
      "answer": "HashMap"
    }
  ]
}`;

      console.log(`Generating skill test for: ${skill}`);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API error:", errText);
        return new Response(JSON.stringify(fallbackQuestions(skill)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || "";
      console.log("Raw AI response length:", raw.length);

      const parsed = extractJSON(raw);

      // Validate
      if (!parsed?.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        console.warn("Invalid/empty questions from AI, using fallback");
        return new Response(JSON.stringify(fallbackQuestions(skill)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      console.log(`Returning ${parsed.questions.length} questions`);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── LEGACY MODE: single DSA question ─────────────────────────────────────
    const difficultyMap: Record<string, string> = {
      Beginner: "easy", Intermediate: "medium", Expert: "hard",
      easy: "easy", medium: "medium", hard: "hard"
    };
    const difficulty = difficultyRaw ? difficultyMap[difficultyRaw] : undefined;

    if (!difficulty) {
      return new Response(JSON.stringify({ error: "Invalid difficulty" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: `You are a strict JSON generator.

Generate ONE DSA question of ${difficulty} difficulty.

Return ONLY valid JSON, no markdown, no explanation:

{
  "title": "string",
  "description": "string",
  "constraints": "string",
  "sample_input": "string",
  "sample_output": "string"
}`,
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: "Groq API Error: " + errorText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || "";
    const parsedData = extractJSON(rawText);

    if (!parsedData) {
      console.log("RAW GROQ TEXT:", rawText);
      return new Response(JSON.stringify({ error: "Failed to parse Groq response" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});