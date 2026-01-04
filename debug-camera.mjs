import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

console.log('Navigation complete, waiting for PlayCanvas to load...');
await page.waitForTimeout(3000);

const canvasVisible = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { exists: false };
  const rect = canvas.getBoundingClientRect();
  return {
    exists: true,
    visible: rect.width > 0 && rect.height > 0,
    width: rect.width,
    height: rect.height
  };
});

console.log('Canvas state:', canvasVisible);

if (!canvasVisible.exists) {
  console.error('Canvas not found');
  process.exit(1);
}

const cameraState = await page.evaluate(() => {
  const window_ = window;
  const result = {
    windowPcExists: !!window_.pc,
    appExists: !!window_.pc?.app,
    sceneExists: !!window_.pc?.app?.scene,
    activeCamera: null,
    activeCameraEntity: null,
    rootChildren: null,
    cameraComponent: null,
    cameraEntityStructure: null
  };

  if (window_.pc?.app?.scene) {
    const scene = window_.pc.app.scene;
    result.activeCamera = scene.activeCamera ? {
      type: scene.activeCamera.constructor.name,
      hasTranslate: !!scene.activeCamera.translate,
      entity: scene.activeCamera.entity ? {
        name: scene.activeCamera.entity.name,
        id: scene.activeCamera.entity.getGuid ? scene.activeCamera.entity.getGuid() : 'unknown'
      } : null
    } : null;

    result.activeCameraEntity = scene.activeCameraEntity ? {
      name: scene.activeCameraEntity.name,
      id: scene.activeCameraEntity.getGuid ? scene.activeCameraEntity.getGuid() : 'unknown',
      position: scene.activeCameraEntity.getLocalPosition ? scene.activeCameraEntity.getLocalPosition() : 'N/A',
      children: scene.activeCameraEntity.children?.length || 0
    } : null;

    if (window_.pc?.app?.root?.children) {
      result.rootChildren = window_.pc.app.root.children.slice(0, 5).map(child => ({
        name: child.name,
        id: child.getGuid ? child.getGuid() : 'unknown',
        hasCamera: !!child.camera
      }));
    }

    if (scene.activeCameraEntity?.camera) {
      result.cameraComponent = {
        type: scene.activeCameraEntity.camera.constructor.name,
        hasTranslate: !!scene.activeCameraEntity.camera.translate,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(scene.activeCameraEntity.camera))
          .filter(m => m.includes('translate') || m.includes('position') || m.includes('update'))
          .slice(0, 10)
      };
    }

    result.cameraEntityStructure = scene.activeCameraEntity ? {
      hasScript: !!scene.activeCameraEntity.script,
      scripts: scene.activeCameraEntity.script ? Object.keys(scene.activeCameraEntity.script) : [],
      hasRigidBody: !!scene.activeCameraEntity.rigidbody,
      position: scene.activeCameraEntity.getLocalPosition ? {
        x: scene.activeCameraEntity.getLocalPosition().x.toFixed(2),
        y: scene.activeCameraEntity.getLocalPosition().y.toFixed(2),
        z: scene.activeCameraEntity.getLocalPosition().z.toFixed(2)
      } : null
    } : null;
  }

  return result;
});

console.log('\nCamera State:', JSON.stringify(cameraState, null, 2));

const initialPos = await page.evaluate(() => {
  if (window.pc?.app?.scene?.activeCameraEntity) {
    const pos = window.pc.app.scene.activeCameraEntity.getLocalPosition();
    return { x: pos.x, y: pos.y, z: pos.z };
  }
  return null;
});

console.log('\nInitial position:', initialPos);

if (!initialPos) {
  console.error('Could not get initial position - camera entity not accessible');
  await browser.close();
  process.exit(1);
}

console.log('\nSimulating key press: W (forward)...');
await page.keyboard.press('KeyW');
await page.waitForTimeout(100);

const posAfterW = await page.evaluate(() => {
  if (window.pc?.app?.scene?.activeCameraEntity) {
    const pos = window.pc.app.scene.activeCameraEntity.getLocalPosition();
    return { x: pos.x, y: pos.y, z: pos.z };
  }
  return null;
});

console.log('Position after W:', posAfterW);

const deltaW = {
  x: (posAfterW.x - initialPos.x).toFixed(4),
  y: (posAfterW.y - initialPos.y).toFixed(4),
  z: (posAfterW.z - initialPos.z).toFixed(4)
};
console.log('Delta:', deltaW);

if (deltaW.x === '0.0000' && deltaW.y === '0.0000' && deltaW.z === '0.0000') {
  console.warn('No movement detected after W key press');
}

console.log('\nSimulating key press: A (left)...');
await page.keyboard.press('KeyA');
await page.waitForTimeout(100);

const posAfterA = await page.evaluate(() => {
  if (window.pc?.app?.scene?.activeCameraEntity) {
    const pos = window.pc.app.scene.activeCameraEntity.getLocalPosition();
    return { x: pos.x, y: pos.y, z: pos.z };
  }
  return null;
});

const deltaA = {
  x: (posAfterA.x - posAfterW.x).toFixed(4),
  y: (posAfterA.y - posAfterW.y).toFixed(4),
  z: (posAfterA.z - posAfterW.z).toFixed(4)
};
console.log('Position after A:', posAfterA);
console.log('Delta:', deltaA);

console.log('\nSimulating key press: D (right)...');
await page.keyboard.press('KeyD');
await page.waitForTimeout(100);

const posAfterD = await page.evaluate(() => {
  if (window.pc?.app?.scene?.activeCameraEntity) {
    const pos = window.pc.app.scene.activeCameraEntity.getLocalPosition();
    return { x: pos.x, y: pos.y, z: pos.z };
  }
  return null;
});

const deltaD = {
  x: (posAfterD.x - posAfterA.x).toFixed(4),
  y: (posAfterD.y - posAfterA.y).toFixed(4),
  z: (posAfterD.z - posAfterA.z).toFixed(4)
};
console.log('Position after D:', posAfterD);
console.log('Delta:', deltaD);

console.log('\nSimulating key press: S (backward)...');
await page.keyboard.press('KeyS');
await page.waitForTimeout(100);

const posAfterS = await page.evaluate(() => {
  if (window.pc?.app?.scene?.activeCameraEntity) {
    const pos = window.pc.app.scene.activeCameraEntity.getLocalPosition();
    return { x: pos.x, y: pos.y, z: pos.z };
  }
  return null;
});

const deltaS = {
  x: (posAfterS.x - posAfterD.x).toFixed(4),
  y: (posAfterS.y - posAfterD.y).toFixed(4),
  z: (posAfterS.z - posAfterD.z).toFixed(4)
};
console.log('Position after S:', posAfterS);
console.log('Delta:', deltaS);

console.log('\n=== SUMMARY ===');
console.log('W: ', deltaW);
console.log('A: ', deltaA);
console.log('D: ', deltaD);
console.log('S: ', deltaS);

const movements = [deltaW, deltaA, deltaD, deltaS];
const anyMovement = movements.some(m =>
  parseFloat(m.x) !== 0 || parseFloat(m.y) !== 0 || parseFloat(m.z) !== 0
);

if (anyMovement) {
  console.log('RESULT: Camera controls ARE working');
} else {
  console.log('RESULT: Camera controls NOT working - no position changes detected');
}

await browser.close();
process.exit(anyMovement ? 0 : 1);
