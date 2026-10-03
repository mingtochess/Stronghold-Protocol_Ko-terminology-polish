import { useEffect, useRef, useState } from '../../vendor/hooks.module.js';
import { html } from './components.js';
import { store, useStore } from '../store.js';
import { net } from '../net.js';
import { toastError } from './toasts.js';
import { CHAT_MAX_LENGTH, normalizeChatText } from '../../../shared/chat.js';

export function ChatPanel() {
  const messages = useStore((s) => s.chat);
  const online = useStore((s) => s.connection.status === 'online');
  const finished = useStore((s) => !!s.match.result);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
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

  const send = async (event) => {
    event.preventDefault();
    const value = normalizeChatText(text);
    if (!value || composing.current || sending || !online || finished) return;
    setSending(true);
    try {
      await net.request('g.chat', { text: value });
      setText('');
    } catch (error) { toastError(error); }
    finally { setSending(false); input.current?.focus(); }
  };
  const keyboard = (event) => {
    event.stopPropagation();
    if (event.key === 'Escape' && !event.isComposing) { setOpen(false); }
    if (event.key === 'Enter' && (event.isComposing || composing.current || event.keyCode === 229)) event.preventDefault();
  };

  return html`<aside class="game-chat" aria-label="게임 채팅" onKeyDown=${keyboard} onPointerDown=${(e) => e.stopPropagation()}>
    ${open ? html`<section class="game-chat__panel" id="game-chat-panel" aria-label="게임 채팅창">
      <header><strong>게임 채팅</strong><button type="button" aria-label="채팅 닫기" onClick=${() => setOpen(false)}>×</button></header>
      <div class="game-chat__messages" ref=${list} role="log" aria-live="polite" aria-relevant="additions" data-i18n-skip>
        ${!messages.length ? html`<p class="game-chat__empty">같은 게임의 참가자에게 메시지를 보내세요.</p>` : messages.map((m) => html`<p key=${m.id} class=${m.playerId === store.get().me.playerId ? 'is-own' : ''}><strong>${m.name}</strong><span>${m.text}</span></p>`)}
      </div>
      <form onSubmit=${send}>
        <input ref=${input} type="text" aria-label="채팅 메시지" placeholder=${!online ? '연결이 끊겼습니다' : finished ? '게임이 종료됐습니다' : '메시지 입력…'}
          value=${text} maxLength=${CHAT_MAX_LENGTH} disabled=${!online || finished} autoComplete="off"
          onInput=${(e) => setText(e.currentTarget.value)} onCompositionStart=${() => { composing.current = true; }} onCompositionEnd=${() => { composing.current = false; }} />
        <button type="submit" disabled=${sending || !online || finished || !normalizeChatText(text)}>전송</button>
      </form>
    </section>` : null}
    <button class="game-chat__toggle" type="button" aria-expanded=${open} aria-controls="game-chat-panel" onClick=${() => setOpen(!open)}>
      ${open ? '채팅 닫기' : '채팅'}${!open && unread ? html`<span class="game-chat__badge" aria-label=${`읽지 않은 메시지 ${unread}개`}>${unread > 99 ? '99+' : unread}</span>` : null}
    </button>
  </aside>`;
}
