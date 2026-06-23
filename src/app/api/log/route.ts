import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.apiName || !body.endpoint) {
      return NextResponse.json({ error: 'Missing apiName or endpoint' }, { status: 400 });
    }

    const log = await prisma.apiLog.create({
      data: {
        apiName: body.apiName,
        endpoint: body.endpoint,
      }
    });

    return NextResponse.json({ success: true, log });
  } catch (e) {
    console.error("Failed to log API usage:", e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
