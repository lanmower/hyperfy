console.log('[RENDER_DIAGNOSTIC] Starting 3D scene diagnostic...');

let attempts = 0;
const maxAttempts = 30;

const checkScene = setInterval(() => {
  attempts++;
  console.log(`[CHECK ${attempts}/${maxAttempts}] Checking for PlayCanvas app...`);

  const app = window.pc?.app;

  if (app && app.isRunning) {
    clearInterval(checkScene);
    console.log('\n=== RENDERING STATUS ===');
    console.log('App running:', app.isRunning);
    console.log('App enabled:', app.enabled);
    console.log('Root entity:', app.root?.name);
    console.log('Root children count:', app.root?.children?.length);

    if (app.root?.children?.length > 0) {
      console.log('\nRoot children:');
      app.root.children.forEach((child, i) => {
        console.log(`  [${i}] ${child.name}`);
        console.log(`      Type: ${child.constructor.name}`);
        console.log(`      Enabled: ${child.enabled}`);
        if (child.camera) {
          console.log(`      Has camera: true`);
          console.log(`      Position: ${child.getLocalPosition()?.toString()}`);
        }
      });
    }

    console.log('\nCamera info:');
    console.log('Active camera entity:', app.scene?.activeCameraEntity?.name);
    const pos = app.scene?.activeCameraEntity?.getLocalPosition?.();
    console.log('Active camera position:', pos ? `(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})` : 'unknown');

    // Check if there are any mesh instances
    const meshInstances = app.scene?.getMeshInstances?.() || [];
    console.log('\nMesh instances in scene:', meshInstances.length);

    if (meshInstances.length > 0) {
      console.log('First 5 meshes:');
      meshInstances.slice(0, 5).forEach((mesh, i) => {
        console.log(`  Mesh [${i}]: ${mesh.node?.name || 'unknown'}`);
      });
    }

    // Check canvas
    console.log('\nCanvas info:');
    const canvas = document.querySelector('canvas');
    console.log('Canvas found:', !!canvas);
    console.log('Canvas resolution:', canvas?.width, 'x', canvas?.height);
    console.log('Canvas CSS size:', canvas?.offsetWidth, 'x', canvas?.offsetHeight);

    const rect = canvas?.getBoundingClientRect();
    console.log('Canvas on screen:', !!rect && rect.width > 0 && rect.height > 0);

    console.log('\n=== CONCLUSION ===');
    if (meshInstances.length > 0) {
      console.log('SUCCESS: 3D scene is rendering with ' + meshInstances.length + ' mesh instances');
    } else if (app.scene?.activeCameraEntity) {
      console.log('PARTIAL: Camera is active but no meshes visible');
    } else {
      console.log('ISSUE: App running but camera not active');
    }

    return;
  }

  if (attempts >= maxAttempts) {
    clearInterval(checkScene);
    console.log('\n=== TIMEOUT ===');
    console.log('PlayCanvas app not initialized after 30 attempts');
    console.log('window.pc:', typeof window.pc);
    console.log('window.pc.app:', window.pc?.app ? 'exists' : 'null');
  }
}, 1000);
