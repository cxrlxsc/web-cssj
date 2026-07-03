// src/components/admin/useAdminDialogs.tsx
// Diálogos con estilo de la app (confirmar / alerta / prompt) para reemplazar
// window.confirm / alert / prompt. API basada en promesas:
//   const { confirm, alert, prompt, dialogs } = useAdminDialogs();
//   if (await confirm({ title, message })) { ... }
//   const motivo = await prompt({ title, message });
//   await alert({ title, message, tone: 'success' });
// Y renderiza {dialogs} dentro del componente.
import { useRef, useState } from 'react';

const NAVY = '#002a4a';
const VERDE = '#008C5A';

type Tone = 'verde' | 'navy';
type AlertTone = 'success' | 'error' | 'info';

interface ConfirmOpts { title: string; message: string; confirmLabel?: string; tone?: Tone }
interface PromptOpts { title: string; message: string; placeholder?: string; confirmLabel?: string }
interface AlertOpts { title: string; message: string; tone?: AlertTone }

type DialogState =
  | ({ kind: 'confirm' } & ConfirmOpts)
  | ({ kind: 'prompt' } & PromptOpts)
  | ({ kind: 'alert' } & AlertOpts);

export function useAdminDialogs() {
  const [state, setState] = useState<DialogState | null>(null);
  const resolver = useRef<((value: any) => void) | null>(null);

  const open = <T,>(next: DialogState) =>
    new Promise<T>((resolve) => {
      resolver.current = resolve as (v: any) => void;
      setState(next);
    });

  const confirm = (opts: ConfirmOpts) => open<boolean>({ kind: 'confirm', ...opts });
  const prompt = (opts: PromptOpts) => open<string | null>({ kind: 'prompt', ...opts });
  const alert = (opts: AlertOpts) => open<void>({ kind: 'alert', ...opts });

  const resolve = (value: any) => {
    setState(null);
    resolver.current?.(value);
    resolver.current = null;
  };

  const dialogs = state ? <DialogUI state={state} resolve={resolve} /> : null;

  return { confirm, prompt, alert, dialogs };
}

function DialogUI({ state, resolve }: { state: DialogState; resolve: (v: any) => void }) {
  const [text, setText] = useState('');

  return (
    <div style={overlay} onMouseDown={(e) => { if (e.target === e.currentTarget && state.kind !== 'prompt') resolve(state.kind === 'confirm' ? false : undefined); }}>
      <div style={card}>
        {state.kind === 'alert' && (
          <>
            <div style={{ ...iconWrap, background: toneBg(state.tone), color: toneFg(state.tone) }}>
              {toneIcon(state.tone)}
            </div>
            <h2 style={{ ...title, textAlign: 'center' }}>{state.title}</h2>
            <p style={{ ...message, textAlign: 'center' }}>{state.message}</p>
            <button style={{ ...btnPrimary, width: '100%', marginTop: '1.3rem', justifyContent: 'center', background: state.tone === 'error' ? '#dc2626' : VERDE }} onClick={() => resolve(undefined)}>
              Entendido
            </button>
          </>
        )}

        {state.kind === 'confirm' && (
          <>
            <h2 style={title}>{state.title}</h2>
            <p style={message}>{state.message}</p>
            <div style={row}>
              <button style={btnGhost} onClick={() => resolve(false)}>Cancelar</button>
              <button style={{ ...btnPrimary, background: state.tone === 'navy' ? NAVY : VERDE }} onClick={() => resolve(true)}>
                {state.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </>
        )}

        {state.kind === 'prompt' && (
          <>
            <h2 style={title}>{state.title}</h2>
            <p style={message}>{state.message}</p>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) resolve(text.trim()); if (e.key === 'Escape') resolve(null); }}
              placeholder={state.placeholder || ''}
              style={input}
            />
            <div style={row}>
              <button style={btnGhost} onClick={() => resolve(null)}>Cancelar</button>
              <button style={{ ...btnPrimary, background: '#dc2626', opacity: text.trim() ? 1 : 0.5, cursor: text.trim() ? 'pointer' : 'not-allowed' }} disabled={!text.trim()} onClick={() => resolve(text.trim())}>
                {state.confirmLabel || 'Enviar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function toneBg(t?: AlertTone) { return t === 'success' ? '#dcfce7' : t === 'error' ? '#fee2e2' : '#e0f2fe'; }
function toneFg(t?: AlertTone) { return t === 'success' ? VERDE : t === 'error' ? '#dc2626' : '#0369a1'; }
function toneIcon(t?: AlertTone) {
  if (t === 'success') return <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
  if (t === 'error') return <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
  return <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 };
const card: React.CSSProperties = { background: 'white', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.8rem', boxShadow: '0 20px 45px rgba(0,0,0,0.25)' };
const iconWrap: React.CSSProperties = { width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem' };
const title: React.CSSProperties = { margin: 0, color: NAVY, fontSize: '1.25rem', fontWeight: 800 };
const message: React.CSSProperties = { margin: '0.7rem 0 0', color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.5 };
const row: React.CSSProperties = { display: 'flex', gap: '0.6rem', marginTop: '1.5rem', justifyContent: 'flex-end' };
const input: React.CSSProperties = { width: '100%', marginTop: '1rem', padding: '0.7rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { background: VERDE, color: 'white', border: 'none', borderRadius: '8px', padding: '0.7rem 1.4rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' };
const btnGhost: React.CSSProperties = { background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.7rem 1.3rem', fontWeight: 700, cursor: 'pointer' };
