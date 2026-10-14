#!/usr/bin/env node

/**
 * EduOps Remote School Server Tunnel
 * Exposes local port 5001 over a secure, free Cloudflare HTTPS tunnel
 * so users outside the school (at home, on mobile, or via GitHub Pages)
 * can communicate directly with the school's SQLite database server.
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5001;
const TARGET_URL = `http://127.0.0.1:${PORT}`;

function saveTunnelUrl(url) {
  try {
    const dataDir = path.resolve(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.resolve(dataDir, 'tunnel_url.txt'), url, 'utf8');

    const payload = JSON.stringify({ active: true, url, updatedAt: new Date().toISOString() }, null, 2);
    const publicDir = path.resolve(__dirname, '../public');
    if (fs.existsSync(publicDir)) {
      fs.writeFileSync(path.resolve(publicDir, 'active_tunnel.json'), payload, 'utf8');
    }
    const distDir = path.resolve(__dirname, '../dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.resolve(distDir, 'active_tunnel.json'), payload, 'utf8');
    }
  } catch (e) {
    // ignore
  }
}

function clearTunnelUrl() {
  try {
    const dataDir = path.resolve(__dirname, 'data');
    const txt = path.resolve(dataDir, 'tunnel_url.txt');
    if (fs.existsSync(txt)) fs.unlinkSync(txt);

    const payload = JSON.stringify({ active: false, url: '', updatedAt: new Date().toISOString() }, null, 2);
    const publicDir = path.resolve(__dirname, '../public');
    if (fs.existsSync(publicDir)) {
      fs.writeFileSync(path.resolve(publicDir, 'active_tunnel.json'), payload, 'utf8');
    }
    const distDir = path.resolve(__dirname, '../dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.resolve(distDir, 'active_tunnel.json'), payload, 'utf8');
    }
  } catch (e) {
    // ignore
  }
}

console.log('\n================================================================');
console.log('       🏫 EDUOPS REMOTE SCHOOL SERVER TUNNEL LAUNCHER');
console.log('================================================================');
console.log(`📡 Checking local server on ${TARGET_URL}...`);

// Check if local backend is responding
function checkLocalServer(callback) {
  let called = false;
  const finish = (result) => {
    if (called) return;
    called = true;
    callback(result);
  };
  const req = http.get(`${TARGET_URL}/api/health`, (res) => {
    res.resume();
    finish(true);
  });
  req.on('error', () => {
    finish(false);
  });
  req.setTimeout(2500, () => {
    req.destroy();
    finish(false);
  });
}

checkLocalServer((isRunning) => {
  if (!isRunning) {
    console.log(`⚠️  Local server on port ${PORT} does not seem to be running.`);
    console.log(`👉 Please ensure you run 'npm run dev' or 'npm run server' first.\n`);
  } else {
    console.log(`✅ Local server is running on port ${PORT} (SQLite connected).\n`);
  }

  startCloudflareTunnel();
});

function startCloudflareTunnel() {
  console.log('🚀 Requesting secure HTTPS public tunnel via Cloudflare...');
  console.log('⏳ (No account, no port-forwarding, and no firewall changes required)\n');

  const args = ['--yes', 'cloudflared', 'tunnel', '--url', TARGET_URL];
  const proc = spawn('npx', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env
  });

  let tunnelUrlFound = false;

  const onData = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !tunnelUrlFound) {
      tunnelUrlFound = true;
      const url = match[0];
      printSuccessBanner(url);
    }
  };

  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);

  proc.on('error', (err) => {
    console.error('❌ Failed to start cloudflared:', err.message);
    startLocaltunnelFallback();
  });

  proc.on('close', (code) => {
    if (!tunnelUrlFound && code !== 0) {
      console.log('⚠️  Cloudflare tunnel exited. Trying localtunnel fallback...');
      startLocaltunnelFallback();
    } else {
      console.log('\n🛑 Tunnel closed.');
    }
  });

  process.on('SIGINT', () => {
    proc.kill('SIGINT');
    process.exit(0);
  });
}

function startLocaltunnelFallback() {
  console.log('🚀 Starting localtunnel fallback on port ' + PORT + '...');
  const args = ['--yes', 'localtunnel', '--port', PORT.toString()];
  const proc = spawn('npx', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env
  });

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/);
    if (match) {
      printSuccessBanner(match[0]);
    }
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
}

function printSuccessBanner(url) {
  saveTunnelUrl(url);

  console.log('\n================================================================');
  console.log('  🎉 SUCCESS! YOUR SCHOOL SERVER IS NOW ACCESSIBLE FROM ANYWHERE');
  console.log('================================================================\n');
  console.log('  🔗 PUBLIC SERVER HTTPS URL:');
  console.log(`     \x1b[1m\x1b[32m${url}\x1b[0m\n`);
  console.log('  📱 HOW TO CONNECT FROM HOME, PHONES, OR GITHUB PAGES:');
  console.log('  1. Open your live app in browser:');
  console.log('     https://nurassyl2006.github.io/material-ticket-platform/\n');
  console.log('  2. Click the [DB Synced / Offline] badge in the top navigation bar.');
  console.log('  3. In the "Remote Server URL" box, paste:');
  console.log(`     ${url}`);
  console.log('  4. Click "Save & Connect".\n');
  console.log('  💡 The badge will turn GREEN (Connected) from anywhere in the world,');
  console.log('     and all tickets & updates will save directly to your SQLite database!');
  console.log('================================================================\n');
  console.log('  ⚠️  IMPORTANT: KEEP THIS TERMINAL OPEN!');
  console.log('  Closing this window or pressing Ctrl+C will terminate the tunnel.');
  console.log('  To keep it running in the background permanently, run:');
  console.log('    nohup npm run tunnel > ~/tunnel.log 2>&1 &\n');
}

const cleanup = () => {
  clearTunnelUrl();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', clearTunnelUrl);
