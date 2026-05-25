window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const orientationOverlay = document.getElementById('orientationOverlay');

  // DPI-aware canvas sizing
  const dpr = window.devicePixelRatio || 1;
  canvas.width = C.WIDTH * dpr;
  canvas.height = C.HEIGHT * dpr;
  canvas.style.width = C.WIDTH + 'px';
  canvas.style.height = C.HEIGHT + 'px';

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.scale(dpr, dpr);

  // Orientation check
  function checkOrientation() {
    if (window.innerWidth > window.innerHeight && window.innerWidth > 500) {
      orientationOverlay.classList.add('visible');
    } else {
      orientationOverlay.classList.remove('visible');
    }
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();

  // Boot game
  const game = new Game(canvas, ctx);
  game.start();
});
