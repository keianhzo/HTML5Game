window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const orientationOverlay = document.getElementById('orientationOverlay');

  // Scale canvas CSS size to fit the viewport, preserving aspect ratio
  const aspectRatio = C.WIDTH / C.HEIGHT;
  let cssW, cssH;
  if (window.innerWidth / window.innerHeight > aspectRatio) {
    cssH = window.innerHeight;
    cssW = Math.floor(cssH * aspectRatio);
  } else {
    cssW = window.innerWidth;
    cssH = Math.floor(cssW / aspectRatio);
  }
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';

  // Physical canvas resolution for crisp rendering on high-DPI screens
  const dpr = window.devicePixelRatio || 1;
  canvas.width = C.WIDTH * dpr;
  canvas.height = C.HEIGHT * dpr;

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
