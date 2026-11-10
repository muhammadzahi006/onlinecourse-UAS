'use client';
import { useEffect, useRef, useState } from 'react';

function decodeKey(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function saveSubscription() {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const keyResponse = await fetch('/api/push-subscriptions/key');
    const key = await keyResponse.json();
    if (!keyResponse.ok) throw new Error(key.error || 'Kunci notifikasi belum tersedia.');
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(key.key) });
  }
  const response = await fetch('/api/push-subscriptions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Subscription belum bisa disimpan.');
}

export function EnableNotifications() {
  const [state, setState] = useState('checking');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const registration = useRef(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported');
      return;
    }
    navigator.serviceWorker.register('/sw.js')
      .then(async value => {
        registration.current = value;
        if (Notification.permission === 'granted') {
          setState('saving');
          try { await saveSubscription(); setState('active'); }
          catch (error) { setState('error'); setMessage(error.message); }
        } else if (Notification.permission === 'denied') {
          setState('denied');
        } else {
          setState('needs-permission');
        }
      })
      .catch(error => { setState('error'); setMessage(error.message || 'Service worker belum bisa dijalankan.'); });
  }, []);

  async function enable() {
    setBusy(true);
    setMessage('');
    try {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setState(permission === 'denied' ? 'denied' : 'needs-permission');
          return;
        }
      }
      if (!registration.current) registration.current = await navigator.serviceWorker.ready;
      setState('saving');
      await saveSubscription();
      setState('active');
    } catch (error) {
      setState('error');
      setMessage(error.message || 'Notifikasi belum bisa diaktifkan.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'checking' || state === 'saving') return <span className="push-status" role="status">{state === 'saving' ? 'Menyimpan notifikasi…' : 'Memeriksa notifikasi…'}</span>;
  if (state === 'active') return <span className="push-status push-active" role="status">Notifikasi aktif ✓</span>;
  if (state === 'unsupported') return <span className="push-status" role="status">Browser tidak mendukung notifikasi push.</span>;
  if (state === 'denied') return <span className="push-status" role="status">Izin notifikasi ditolak. Ubah izin situs di pengaturan browser.</span>;

  return <div className="push-control">
    {state === 'error' && <span role="status">{message}</span>}
    <button className="push-button" onClick={enable} disabled={busy}>
      {busy ? 'Memproses…' : state === 'error' ? 'Coba lagi' : 'Izinkan notifikasi'}
    </button>
  </div>;
}
