// src/app/api/auth/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// 一時的なメモリストレージ（本番ではDBを使用）
const connections = new Map<string, {
  app_id: string;
  user_id: string;
  service_type: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  created_at: number;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, service_type, app_id, state } = body;

    console.log('Token exchange request:', { service_type, app_id, state });

    if (!code || !service_type || !app_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let accessToken: string;
    let refreshToken: string | undefined;
    let expiresAt: number | undefined;

    // サービス別のトークン交換
    switch (service_type) {
      case 'todoist':
        const todoistTokens = await exchangeTodoistToken(code);
        accessToken = todoistTokens.access_token;
        break;

      case 'google_tasks':
        const googleTokens = await exchangeGoogleToken(code);
        accessToken = googleTokens.access_token;
        refreshToken = googleTokens.refresh_token;
        expiresAt = googleTokens.expires_at;
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported service: ${service_type}` },
          { status: 400 }
        );
    }

    // Connection Tokenを生成
    const connectionToken = nanoid(32);
    const userId = nanoid(16); // 実際のユーザー識別子

    // 接続情報を保存
    connections.set(connectionToken, {
      app_id,
      user_id: userId,
      service_type,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      created_at: Date.now(),
    });

    console.log('Connection created:', connectionToken);

    // TODO: redirect_uriを実際のアプリ設定から取得
    const redirectUri = 'http://localhost:3000/auth/success'; // デモ用

    return NextResponse.json({
      connection_token: connectionToken,
      redirect_uri: redirectUri,
      user_id: userId,
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { 
        error: 'Token exchange failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Todoistトークン交換
async function exchangeTodoistToken(code: string) {
  const response = await fetch('https://todoist.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.TODOIST_CLIENT_ID || '',
      client_secret: process.env.TODOIST_CLIENT_SECRET || '',
      code: code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/callback`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Todoist token exchange failed: ${errorText}`);
  }

  return response.json();
}

// Google Tasksトークン交換
async function exchangeGoogleToken(code: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/callback`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const tokens = await response.json();
  
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : undefined,
  };
}

// Connection情報取得用のGET endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const connectionToken = searchParams.get('connection_token');

  if (!connectionToken) {
    return NextResponse.json(
      { error: 'connection_token is required' },
      { status: 400 }
    );
  }

  const connection = connections.get(connectionToken);
  if (!connection) {
    return NextResponse.json(
      { error: 'Invalid connection token' },
      { status: 404 }
    );
  }

  // アクセストークンは返さない（セキュリティ）
  return NextResponse.json({
    app_id: connection.app_id,
    user_id: connection.user_id,
    service_type: connection.service_type,
    created_at: connection.created_at,
  });
}