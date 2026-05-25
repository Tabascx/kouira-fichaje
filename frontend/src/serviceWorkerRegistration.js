// Registro simple de service worker para PWA
// En entorno de desarrollo Create React App no crea /service-worker.js,
// pero al hacer `npm run build` y desplegar con workbox, sí estará disponible.
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then(reg => {
        console.log('ServiceWorker registrado:', reg.scope);
      }).catch(err => console.warn('Error registrando serviceWorker:', err));
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => reg.unregister());
  }
}

