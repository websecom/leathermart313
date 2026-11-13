import Groq from 'groq-sdk';
import { isCurrentUserAdmin } from 'lib/admin-auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { title, productType, material } = body as Record<string, unknown>;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Product title is required.' }, { status: 400 });
  }

  const groq = new Groq({ apiKey });

  const prompt = [
    `Write a concise, engaging product description for an ecommerce store.`,
    `Product name: "${title.trim()}"`,
    productType ? `Type: ${productType}` : '',
    material ? `Material: ${material}` : '',
    `Keep it under 120 words. Focus on feel, everyday use, and quality. No bullet points.`
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 160,
      temperature: 0.7
    });

    const description = completion.choices[0]?.message?.content?.trim();
    if (!description) {
      return NextResponse.json({ error: 'AI returned an empty response.' }, { status: 502 });
    }

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json({ error: 'AI description generation failed.' }, { status: 502 });
  }
}
