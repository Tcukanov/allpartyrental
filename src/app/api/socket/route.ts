import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Socket API is working correctly",
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Socket API POST endpoint received",
  });
} 