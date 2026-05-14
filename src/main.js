
import app from './app.js';
import './style.css';
function main() {
  console.log("Hello, World!");
  const apps = [];


  function setup() {
    console.log("Setting up the application...");
    createApp(1, 'projection_2d');
    createApp(2, 'umap_book');
    createApp(3, 'umap_subjects_embeddings');
    createApp(4, 'umap_random');

    setupFocusButton();
    animate();
  }

  function setupFocusButton() {
    const btn = document.createElement('button');
    btn.textContent = 'Focus random';
    btn.className = 'focus-btn';
    btn.addEventListener('click', () => {
      const ready = apps.filter(a => a.isReady);
      if (ready.length === 0) return;
      const sets = ready.map(a => new Set(a.object.getIds()));
      const [first, ...rest] = sets;
      const common = [...first].filter(id => rest.every(s => s.has(id)));
      if (common.length === 0) {
        console.warn('No ids in common across datasets');
        return;
      }
      const pickedId = common[Math.floor(Math.random() * common.length)];
      console.log('Focusing on', pickedId);
      apps.forEach(a => a.object.focusOn(pickedId));
    });
    document.body.appendChild(btn);
  }

  function createApp(number, mapType = 'form') {
    const container = document.getElementById(`container-${number}`);
    const id = `canvas-${number}`;
    const newApp = app({ container, id, mapType, state: {}, appIsReady: () => appIsReady(id) });
    apps.push({ object: newApp, id, isReady: false });
  }

  function appIsReady(id) {
    console.log(`App with id ${id} is ready.`);
    const app = apps.find(app => app.id === id);
    if (app) {
      app.isReady = true;
      console.log(`App ${id} is ready.`);
    }
  }

  function animate() {
    apps.forEach(app => {
      if (app.isReady) {
        app.object.animate();
      }
    });

    requestAnimationFrame(animate);
  }

  setup();

}
window.onload = main;