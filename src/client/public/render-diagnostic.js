console.log('[RENDER_DIAGNOSTIC] Starting PlayCanvas render diagnostic...');

let attempts = 0;
const maxAttempts = 30;

const checkScene = setInterval(() => {
  attempts++;
  const app = window.pc?.app;
  const canvas = document.querySelector('canvas');
  const hasGraphics = !!app?.graphicsDevice;
  const hasScene = !!app?.scene;
  const isRenderingContent = canvas && canvas.offsetWidth > 0 && canvas.offsetHeight > 0;

  if (!app) {
    if (attempts % 5 === 0) console.log(`[CHECK ${attempts}/${maxAttempts}] Waiting for PlayCanvas app...`);
    if (attempts >= maxAttempts) {
      clearInterval(checkScene);
      console.log('\n=== PLAYCANVAS INITIALIZATION FAILED ===');
      console.log('window.pc available:', !!window.pc);
      console.log('window.pc.app available:', !!window.pc?.app);
    }
    return;
  }

  if (!hasGraphics || !hasScene) {
    if (attempts % 5 === 0) console.log(`[CHECK ${attempts}/${maxAttempts}] PlayCanvas initializing (graphics: ${hasGraphics}, scene: ${hasScene})...`);
    if (attempts >= maxAttempts) {
      clearInterval(checkScene);
      console.log('\n=== PLAYCANVAS PARTIAL INIT ===');
      console.log('App exists:', !!app);
      console.log('Graphics device:', hasGraphics);
      console.log('Scene:', hasScene);
    }
    return;
  }

  if (!isRenderingContent) {
    if (attempts % 5 === 0) console.log(`[CHECK ${attempts}/${maxAttempts}] PlayCanvas ready, waiting for render...`);
    if (attempts >= maxAttempts) {
      clearInterval(checkScene);
      console.log('\n=== PLAYCANVAS READY BUT NOT RENDERING ===');
      console.log('Canvas size:', `${canvas?.width}x${canvas?.height}`);
      console.log('Canvas visible:', isRenderingContent);
    }
    return;
  }

  clearInterval(checkScene);
  console.log('\n=== PLAYCANVAS RENDER STATUS ===');
  console.log('Graphics device:', !!app.graphicsDevice);
  console.log('Root entity:', app.root?.name);
  console.log('Root children:', app.root?.children?.length || 0);

  if (app.root?.children?.length > 0) {
    console.log('\nScene entities (first 8):');
    app.root.children.slice(0, 8).forEach((child, i) => {
      console.log(`  [${i}] ${child.name}`);
    });
  }

  console.log('\nCamera:');
  console.log('Active camera:', app.scene?.activeCameraEntity?.name || 'none');

  console.log('\nCanvas:');
  console.log('Resolution:', `${canvas?.width}x${canvas?.height}`);
  console.log('Visible:', isRenderingContent);

  console.log('\n=== SUCCESS ===');
  console.log('PlayCanvas engine initialized and rendering');
}, 1000);
