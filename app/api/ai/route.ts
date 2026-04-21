export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, useCase, weights, messages } = body;

    if (action === 'chat') {
      const history = messages.map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const prompt = `You are an AI strategy assistant helping to define, document, and evaluate AI use cases for a business. When the user describes a use case, ask clarifying questions if needed, help define it clearly, and offer to generate a BRD or score it. Be concise, professional, and actionable.

Conversation so far:
${history}

Respond to the last user message.`;

      const response = await callGemini(prompt);
      return NextResponse.json({ content: response });
    }

    if (action === 'score') {
      const prompt = `Score this AI use case based on the following weighted criteria. Return ONLY a JSON object with no markdown or explanation outside the JSON.

Use case:
Name: ${useCase.name}
Description: ${useCase.description}
Impact: ${useCase.impact}

Weights:
${JSON.stringify(weights, null, 2)}

Return JSON in this exact format:
{
  "total": <number 0-100>,
  "breakdown": {
    "roi_potential": <1-5>,
    "complexity": <1-5>,
    "time_to_build": <1-5>,
    "data_availability": <1-5>,
    "differentiation": <1-5>,
    "urgency": <1-5>,
    "strategic_alignment": <1-5>
  },
  "reasoning": "<brief explanation>"
}`;

      const text = await callGemini(prompt);
      const clean = text.replace(/```json|```/g, '').trim();
      return NextResponse.json(JSON.parse(clean));
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}