import { Container } from '@cloudflare/containers';
import { gameStub } from './routing.mjs';

interface Env {
  GAME: DurableObjectNamespace<GameServer>;
  ASSETS: Fetcher;
}

// Retain the existing binding and storage while disabling container operation.
export class GameServer extends Container<Env> {
  defaultPort = 3000;
  sleepAfter = '15m';

  async deactivate() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.put('activated', false);
    if (this.ctx.container?.running) await this.destroy();
  }

  override async fetch(): Promise<Response> {
    await this.deactivate();
    return Response.json({ ok: true, containerActive: false }, { headers: { 'Cache-Control': 'no-store' } });
  }

  override async onStart() { await this.deactivate(); }
  async ensureWarm() { await this.deactivate(); }
  async keepWarm() { await this.deactivate(); }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/healthz') return gameStub(env.GAME).fetch(request);
    const target = new URL('https://web.ming.party');
    target.pathname = url.pathname;
    target.search = url.search;
    return Response.redirect(target.toString(), 307);
  },
} satisfies ExportedHandler<Env>;
