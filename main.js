import * as THREE from 'three';

document.body.addEventListener('mousemove', (e) => {
  document.body.style.setProperty('--cursorX', `${e.clientX}px`);
  document.body.style.setProperty('--cursorY', `${e.clientY}px`);
});

const afterStyle = document.createElement('style');
afterStyle.textContent = `
  body, button, input, a, [type="button"], [type="submit"], [role="button"], canvas {
    cursor: none !important;
  }
  body::after {
    content: '';
    position: fixed;
    top: var(--cursorY, 0);
    left: var(--cursorX, 0);
    width: 8px;
    height: 8px;
    background: #d4d4d4;
    border-radius: 50%;
    pointer-events: none;
    z-index: 1000;
    transition: top 0.05s ease, left 0.05s ease;
  }
`;
document.head.appendChild(afterStyle);

const typewriterText = "0X1B";
const typewriterElement = document.getElementById('typewriter');
let i = 0;

function typeWriter() {
  if (i < typewriterText.length) {
    typewriterElement.textContent += typewriterText.charAt(i);
    i++;
    setTimeout(typeWriter, 50);
  }
}
typeWriter();

function navigateWithFade(url) {
  const normalizedUrl = url === '/' ? '/index.html' : url;
  const pageContent = document.querySelector('#page-content');
  if (!pageContent) {
    window.location.href = normalizedUrl;
    return;
  }
  pageContent.style.opacity = '0';
  pageContent.addEventListener('transitionend', function onTransitionEnd() {
    pageContent.removeEventListener('transitionend', onTransitionEnd);
    fetch(normalizedUrl)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newContent = doc.querySelector('#page-content');
        if (!newContent) {
          window.location.href = normalizedUrl;
          return;
        }
        pageContent.innerHTML = newContent.innerHTML;
        history.pushState({}, '', url);
        const canvas = document.getElementById('webgl-canvas');
        if (canvas) {
          const isIndex = url === '/' || url === '/index.html';
          canvas.style.display = isIndex ? 'block' : 'none';
          if (isIndex) {
            initTorus();
          }
        }
        setTimeout(() => {
          pageContent.style.opacity = '1';
        }, 50);
      })
      .catch(() => {
        window.location.href = normalizedUrl;
      });
  }, { once: true });
}

typewriterElement.addEventListener('click', () => {
  navigateWithFade('/index.html');
});

document.body.addEventListener('click', (e) => {
  const link = e.target.closest('.projects a');
  if (link) {
    e.preventDefault();
    const url = link.getAttribute('href');
    navigateWithFade(url);
  }
});

const audio = new Audio('assets/audio/background.mp3');
audio.loop = true;
audio.volume = 1;
let isPlaying = false;
let isPaused = false;

const visualizer = document.getElementById('audio-visualizer');
if (visualizer) {
  for (let i = 0; i < 3; i++) {
    const circle = document.createElement('div');
    circle.classList.add('circle');
    circle.style.right = `${i * 30}px`;
    visualizer.appendChild(circle);
  }
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
let source = null;

let currentScales = [0.5, 0.5, 0.5];

document.addEventListener('click', () => {
  if (!isPlaying && !isPaused && visualizer) {
    if (audioContext.state === 'suspended') audioContext.resume();
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    audio.play().then(() => {
      isPlaying = true;
      animateCircles();
    });
  }
});

function animateCircles() {
  if (!visualizer) return;
  clearInterval(visualizer._waveInterval);
  visualizer._waveInterval = setInterval(() => {
    if (!isPaused) {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
      const scale = 0.5 + (avg / 255) * 2.5;
      document.querySelectorAll('.circle').forEach((circle, index) => {
        currentScales[index] = scale * (1 - index * 0.2);
        circle.style.transform = `scale(${currentScales[index]})`;
      });
    }
  }, 10);
}

visualizer.addEventListener('click', () => {
  if (!visualizer) return;
  isPaused = !isPaused;
  visualizer.classList.toggle('paused', isPaused);

  const fadeDuration = 800;
  const steps = 40;
  const stepTime = fadeDuration / steps;
  let currentStep = 0;

  const startVol = audio.volume;
  const endVol = isPaused ? 0 : 1;
  const volStep = (endVol - startVol) / steps;

  const startScales = [...currentScales];
  const endScales = isPaused ? [0.5, 0.5, 0.5] : [0.5, 0.5, 0.5];
  const scaleSteps = startScales.map((start, i) => (endScales[i] - start) / steps);

  clearInterval(visualizer._fadeInterval);
  visualizer._fadeInterval = setInterval(() => {
    currentStep++;
    audio.volume = Math.min(Math.max(startVol + volStep * currentStep, 0), 1);
    currentScales = startScales.map((start, i) => start + scaleSteps[i] * currentStep);
    document.querySelectorAll('.circle').forEach((circle, index) => {
      if (!isPaused) {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
        const pulseScale = 0.5 + (avg / 255) * 2.5;
        circle.style.transform = `scale(${currentScales[index] + (pulseScale - 0.5)})`;
      } else {
        circle.style.transform = `scale(${currentScales[index]})`;
      }
    });
    if (currentStep >= steps) {
      clearInterval(visualizer._fadeInterval);
      if (isPaused) {
        clearInterval(visualizer._waveInterval);
        document.querySelectorAll('.circle').forEach(circle => {
          circle.style.transform = `scale(0.5)`;
        });
        audio.pause();
      } else {
        audio.play().then(() => {
          animateCircles();
        });
      }
    }
  }, stepTime);
});

let currentTorusScale = 0.8;
function initTorus() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd1d1d1, 1, 4);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 1.6;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const geometry = new THREE.TorusKnotGeometry(0.6, 0.18, 160, 24);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xa3a3a3,
    emissive: 0xffcc57,
    roughness: 0,
    metalness: 1,
    ior: 2.333,
    reflectivity: 1,
    iridescence: 0.186,
    iridescenceIOR: 2.333,
    sheen: 1,
    sheenRoughness: 1,
    sheenColor: 0xffffff,
    clearcoat: 1,
    specularIntensity: 1,
    specularColor: 0xffffff,
    wireframe: true,
    fog: true,
    transparent: true,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
    alphaTest: 1,
    side: THREE.FrontSide
  });
  const torusKnot = new THREE.Mesh(geometry, material);
  scene.add(torusKnot);

  let isMouseDown = false;
  let rotationAxis = new THREE.Vector3(1, 1, 0).normalize();
  const rotationSpeed = 0.001;

  function animateTorusToMusic() {
    if (!isPaused && isPlaying) {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
      const targetScale = 0.78 + (avg / 255) * 0.04;
      currentTorusScale = THREE.MathUtils.lerp(currentTorusScale, targetScale, 0.05);
      torusKnot.scale.set(currentTorusScale, currentTorusScale, currentTorusScale);
    } else {
      currentTorusScale = THREE.MathUtils.lerp(currentTorusScale, 0.8, 0.05);
      torusKnot.scale.set(currentTorusScale, currentTorusScale, currentTorusScale);
    }
  }

  document.addEventListener('mousedown', () => { isMouseDown = true; });
  document.addEventListener('mouseup', () => { isMouseDown = false; });

  document.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
      const dx = (e.clientX - window.innerWidth / 2) / window.innerWidth;
      const dy = (e.clientY - window.innerHeight / 2) / window.innerHeight;
      const targetAxis = new THREE.Vector3(dy * 2, dx * 2, 0).normalize();
      rotationAxis.lerp(targetAxis, 0.1);
    }
  });

  function animate() {
    requestAnimationFrame(animate);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(rotationAxis, rotationSpeed);
    torusKnot.quaternion.multiply(quaternion);
    if (!isMouseDown) {
      rotationAxis.lerp(new THREE.Vector3(1, 1, 0).normalize(), 0.05);
    }
    animateTorusToMusic();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

window.addEventListener('load', () => {
  const isIndex = window.location.pathname === '/' || window.location.pathname === '/index.html';
  if (isIndex) {
    const canvas = document.getElementById('webgl-canvas');
    if (canvas) {
      canvas.style.display = 'block';
      initTorus();
    }
  }
});

window.addEventListener('popstate', () => {
  navigateWithFade(window.location.pathname);
});