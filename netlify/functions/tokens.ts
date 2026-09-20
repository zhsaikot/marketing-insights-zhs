import * as fs from 'fs';
import * as path from 'path';

export interface StoredToken {
  provider: 'google' | 'meta';
  accessToken: string;
  refreshToken?: string;
  account?: string;
  expiresAt?: number;
  scopes?: string[];
  connectedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const TOKEN_FILE = path.join(DATA_DIR, 'tokens.json');

// In-memory fallback
const memoryVault: Record<string, StoredToken> = {};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create .data directory, fallback to in-memory vault:', err);
  }
}

async function readTokensFromCloudOrDisk(): Promise<Record<string, StoredToken>> {
  // 1. Upstash Redis REST check if configured
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/get/marketing_insights_tokens`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { result?: string };
        if (json.result) {
          return JSON.parse(json.result);
        }
      }
    } catch (err) {
      console.warn('Error reading from Upstash Redis, falling back to disk/memory:', err);
    }
  }

  // 2. Disk file check
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const content = fs.readFileSync(TOKEN_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    }
  } catch (err) {
    console.warn('Error reading tokens from disk:', err);
  }

  return memoryVault;
}

async function writeTokensToCloudOrDisk(tokens: Record<string, StoredToken>): Promise<void> {
  // 1. Upstash Redis REST check
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      await fetch(`${redisUrl}/set/marketing_insights_tokens`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${redisToken}` },
        body: JSON.stringify(tokens),
      });
    } catch (err) {
      console.warn('Error writing to Upstash Redis:', err);
    }
  }

  // 2. Write to disk
  try {
    ensureDataDir();
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving tokens to disk, saving to memory only:', err);
  }

  // 3. Keep memory in sync
  Object.assign(memoryVault, tokens);
}

export default async (request: Request) => {
  const method = request.method;
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') as 'google' | 'meta' | null;

  try {
    if (method === 'GET') {
      const tokens = await readTokensFromCloudOrDisk();
      if (provider) {
        return new Response(JSON.stringify(tokens[provider] || null), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(tokens), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const payload = (await request.json()) as StoredToken;
      if (!payload.provider || !payload.accessToken) {
        return new Response(
          JSON.stringify({ error: 'Missing required provider or accessToken.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await readTokensFromCloudOrDisk();
      tokens[payload.provider] = {
        ...payload,
        connectedAt: payload.connectedAt || new Date().toISOString(),
      };
      await writeTokensToCloudOrDisk(tokens);

      return new Response(JSON.stringify({ success: true, token: tokens[payload.provider] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      if (!provider) {
        return new Response(JSON.stringify({ error: 'Provider parameter required.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const tokens = await readTokensFromCloudOrDisk();
      delete tokens[provider];
      delete memoryVault[provider];
      await writeTokensToCloudOrDisk(tokens);

      return new Response(JSON.stringify({ success: true, message: `${provider} token deleted.` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server token error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

