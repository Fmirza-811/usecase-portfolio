export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
    }),
  });
  const data = await res.json();
  console.log('Gemini response:', JSON.stringify(data));
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, useCase, weights, messages } = body;

    if (action === 'chat') {
      const history = (messages as { role: string; content: string }[])
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `You are an AI strategy assistant helping to define, document, and evaluate AI use cases for a business. When the user describes a use case, ask clarifying questions if needed, help define it clearly, and offer to generate a BRD or score it. Be concise, professional, and actionable.

Conversation so far:
${history}

Respond to the last user message.`;

      const response = await callGemini(prompt);
      return NextResponse.json({ content: response });
    }

    if (action === 'score') {
      const prompt = `Score this AI use case based on the following weighted criteria. Return ONLY valid JSON with no markdown, no code blocks, no explanation outside the JSON.

Use case:
Name: ${useCase.name}
Description: ${useCase.description}
Impact: ${useCase.impact}

Weights (each criterion scored 1-5, multiplied by weight percentage):
${JSON.stringify(weights, null, 2)}

Return this exact JSON structure:
{"total":75,"breakdown":{"roi_potential":4,"complexity":3,"time_to_build":3,"data_availability":4,"differentiation":3,"urgency":3,"strategic_alignment":4},"reasoning":"Brief explanation here"}`;

      const text = await callGemini(prompt);
      const clean = text.replace(/```json|```/g, '').trim();
      return NextResponse.json(JSON.parse(clean));
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}