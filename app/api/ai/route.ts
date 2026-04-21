export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent';

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
  console.log('Gemini response:', JSON.stringify(data).slice(0, 300));
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

      const prompt = `You are an AI strategy assistant helping businesses evaluate AI use cases. Be concise and helpful.

Conversation:
${history}

Respond to the last user message.`;

      const response = await callGemini(prompt);
      return NextResponse.json({ content: response || 'Sorry, I could not generate a response. Please try again.' });
    }

    if (action === 'score') {
      const prompt = `Score this AI use case. Return ONLY a JSON object, no other text.

Use case: ${useCase.name}
Description: ${useCase.description}
Impact: ${useCase.impact}

Return exactly this JSON:
{"total":75,"breakdown":{"roi_potential":4,"complexity":3,"time_to_build":3,"data_availability":4,"differentiation":3,"urgency":3,"strategic_alignment":4},"reasoning":"Brief explanation"}`;

      const text = await callGemini(prompt);
      console.log('Score text:', text?.slice(0, 200));
      
      if (!text) {
        return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
      }
      
      const clean = text.replace(/```json|```/g, '').trim();
      
      try {
        return NextResponse.json(JSON.parse(clean));
      } catch {
        return NextResponse.json({ error: 'Could not parse AI response', raw: clean }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}