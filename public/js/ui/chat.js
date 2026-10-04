import { useEffect, useRef, useState } from '../../vendor/hooks.module.js';
import { html } from './components.js';
import { store, useStore } from '../store.js';
import { net } from '../net.js';
import { toastError } from './toasts.js';
import { CHAT_MAX_LENGTH, CHAT_FACTIONS, chatFaction, normalizeChatText } from '../../../shared/chat.js';

export function ChatPanel() {
  const messages = useStore((s) => s.chat);
  const online = useStore((s) => s.connection.status === 'online');
  const faction = useStore((s) => s.chatFaction);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [choosingFaction, setChoosingFaction] = useState(false);
  const [readId, setReadId] = useState(0);
  const input = useRef(null);
  const list = useRef(null);
  const composing = useRef(false);
  const lastId = messages.at(-1)?.id || 0;
  const unread = messages.filter((m) => m.id > readId).length;

  useEffect(() => {
    if (!messages.length || open) setReadId(lastId);
    if (open && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [open, messages]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    document.documentElement.classList.add('has-game-chat');
    return () => document.documentElement.classList.remove('has-game-chat');
  }, []);

  const selectFaction = async (value) => {
    if (sending || !online) return;
    setSending(true);
    try {
      await net.request('g.chatFaction', { faction: value });
      setChoosingFaction(false);
      input.current?.focus();
    } catch (error) { toastError(error); }
    finally { setSending(false); }
  };

  const send = async (event) => {
    event.preventDefault();
    const value = normalizeChatText(text);
    if (!value || composing.current || sending || !online) return;
    setSending(true);
    try {
      await net.request('g.chat', { text: value });
      setText('');
    } catch (error) { toastError(error); }
    finally { setSending(false); input.current?.focus(); }
  };
  const keyboard = (event) => {
    event.stopPropagation();
    if (event.key === 'Escape' && !event.isComposing) {
      if (choosingFaction) setChoosingFaction(false);
      else setOpen(false);
    }
    if (event.key === 'Enter' && (event.isComposing || composing.current || event.keyCode === 229)) event.preventDefault();
  };

  return html`<aside class="game-chat" aria-label="게임 채팅" onKeyDown=${keyboard} onPointerDown=${(e) => e.stopPropagation()}>
    ${open ? html`<section class="game-chat__panel" id="game-chat-panel" aria-label="게임 채팅창">
      <header><strong>게임 채팅</strong><button type="button" class="game-chat__faction-toggle"
        aria-expanded=${choosingFaction} aria-controls="game-chat-factions" disabled=${!online || sending}
        style=${faction ? { color: chatFaction(faction)?.color } : null} onClick=${() => setChoosingFaction(!choosingFaction)}>${faction ? `진영: ${faction}` : '진영 선택'}</button>
        <button type="button" class="game-chat__close" aria-label="채팅 닫기" onClick=${() => setOpen(false)}>×</button></header>
      ${choosingFaction ? html`<div id="game-chat-factions" class="game-chat__factions" role="group" aria-label="채팅 진영 선택">
        ${CHAT_FACTIONS.map((f) => html`<button key=${f.name} type="button" style=${{ '--faction-color': f.color }}
          aria-pressed=${faction === f.name} disabled=${sending} onClick=${() => selectFaction(f.name)}>${f.name}</button>`)}
      </div>` : null}
      <div class="game-chat__messages" ref=${list} role="log" aria-live="polite" aria-relevant="additions" data-i18n-skip>
        ${!messages.length ? html`<p class="game-chat__empty">같은 방의 참가자에게 메시지를 보내세요.</p>` : messages.map((m) => html`<p key=${m.id} class=${m.playerId === store.get().me.playerId ? 'is-own' : ''}><strong>${m.name}${chatFaction(m.faction) ? html`<span class="game-chat__faction" style=${{ color: chatFaction(m.faction).color }}>(${m.faction})</span>` : null}</strong><span>${m.text}</span></p>`)}
      </div>
      <form onSubmit=${send}>
        <input ref=${input} type="text" aria-label="채팅 메시지" placeholder=${!online ? '연결이 끊겼습니다' : '메시지 입력…'}
          value=${text} maxLength=${CHAT_MAX_LENGTH} disabled=${!online} autoComplete="off"
          onInput=${(e) => setText(e.currentTarget.value)} onCompositionStart=${() => { composing.current = true; }} onCompositionEnd=${() => { composing.current = false; }} />
        <button type="submit" disabled=${sending || !online || !normalizeChatText(text)}>전송</button>
      </form>
    </section>` : messages.length ? html`<div class="game-chat__preview" aria-label="최근 채팅" data-i18n-skip>
      ${messages.slice(-3).map((m, i, recent) => html`<p key=${m.id} style=${{opacity: [1, .6, .25][recent.length - 1 - i]}}>
        <strong>${m.name}${chatFaction(m.faction) ? html`<span class="game-chat__faction" style=${{color:chatFaction(m.faction).color}}>(${m.faction})</span>` : null}</strong><span>${m.text}</span>
      </p>`)}
    </div>` : null}
    <button class="game-chat__toggle" type="button" aria-label=${open ? '채팅 닫기' : '채팅 열기'} title=${open ? '채팅 닫기' : '채팅 열기'} aria-expanded=${open} aria-controls="game-chat-panel" onClick=${() => setOpen(!open)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H8l-5 3v-6a8 8 0 0 1-1-5 9 9 0 0 1 18 0Z" /><path d="M7 10h8M7 14h5" /></svg>
      ${!open && unread ? html`<span class="game-chat__badge" aria-label=${`읽지 않은 메시지 ${unread}개`}>${unread > 99 ? '99+' : unread}</span>` : null}
    </button>
  </aside>`;
}
