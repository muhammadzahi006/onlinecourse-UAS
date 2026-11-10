self.addEventListener('push', event => {
  let data = { title: 'RuangBelajar', body: 'Ada kabar baru untuk perjalanan belajarmu.', url: '/' };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/icon.svg', badge: '/icon.svg', data: { url: data.url }, tag: data.url }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => { for (const client of windows) if (client.url === url && 'focus' in client) return client.focus(); return clients.openWindow(url); }));
});
