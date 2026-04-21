export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, useCase, weights, messages } = body;

    if (action === 'chat') {
      const systemPrompt = `You are an AI strategy assistant helping to define, document, and evaluate AI use cases for a business.

When the user describes a use case:
1. Ask clarifying questions if needed
2. Help define it clearly
3. When you have enough info, offer to generate a BRD or score it

When asked to generate a BRD, produce a structured document with:
- Executive Summary
- Problem Statement  
- Proposed Solution
- Key Stakeholders
- Expected Benefits & ROI
- Technical Requirements
- Data Requirements
- Risks & Mitigations
- Success Metrics
- Timeline

When asked to score/rank a use case, use these weighted criteria:
${JSON.stringify(weights, null, 2)}

Score each criterion 1-5, multiply by weight, sum for total score out of 100.
Present scores clearly with reasoning.

Be concise, professional, and actionable.`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages,
      });

      return NextResponse.json({ 
        content: response.content[0].type === 'text' ? response.content[0].text : '' 
      });
    }

    if (action === 'generate_brd') {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Generate a comprehensive Business Requirements Document (BRD) for this AI use case:

Name: ${useCase.name}
Department: ${useCase.department}
Description: ${useCase.description}
Expected Impact: ${useCase.impact}
Stakeholder: ${useCase.stakeholder}
Notes: ${useCase.notes}

Format it as a proper BRD document with clear sections.`
        }]
      });

      return NextResponse.json({ 
        brd: response.content[0].type === 'text' ? response.content[0].text : '' 
      });
    }

    if (action === 'score') {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Score this AI use case based on the following weighted criteria. Return ONLY a JSON object.

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
}`
        }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const clean = text.replace(/```json|```/g, '').trim();
      return NextResponse.json(JSON.parse(clean));
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}
