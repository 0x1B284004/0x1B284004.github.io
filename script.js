document.body.addEventListener('mousemove', (e) => {
  document.body.style.setProperty('--cursorX', `${e.clientX}px`);
  document.body.style.setProperty('--cursorY', `${e.clientY}px`);
});
const typingText = document.getElementById('typing-text');
const username = '@0x1B284004';
let charIndex = 0;

function typeWriter() {
    if (charIndex < username.length) {
        typingText.textContent += username.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 100);
    }
}

window.addEventListener('load', () => {
    setTimeout(typeWriter, 500);
});
const audio = document.getElementById('bg-music');
audio.volume = 1;
let isPlaying = false;
let isPaused = false;

const visualizer = document.getElementById('audio-visualizer');
const circles = visualizer.querySelectorAll('.circle');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
let source = null;
let currentScales = [0.5, 0.5, 0.5];
document.addEventListener('click', () => {
  if (!isPlaying && !isPaused) {
    if (audioContext.state === 'suspended') audioContext.resume();
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    audio.play().then(() => {
      isPlaying = true;
      animateCircles();
    }).catch((error) => {
      console.error('Audio play failed:', error);
    });
  }
}, { once: true });

function animateCircles() {
  clearInterval(visualizer._waveInterval);
  visualizer._waveInterval = setInterval(() => {
    if (!isPaused) {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
      const scale = 0.5 + (avg / 255) * 2.5;
      circles.forEach((circle, index) => {
        currentScales[index] = scale * (1 - index * 0.2);
        circle.style.transform = `scale(${currentScales[index]})`;
      });
    }
  }, 10);
}
visualizer.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!isPlaying) return;
  
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
    circles.forEach((circle, index) => {
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
        circles.forEach(circle => {
          circle.style.transform = `scale(0.5)`;
        });
        audio.pause();
      } else {
        audio.play().then(() => {
          animateCircles();
        }).catch((error) => {
          console.error('Audio resume failed:', error);
        });
      }
    }
  }, stepTime);
});
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd1d1d1, 1, 4);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2.8;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
const geometry = new THREE.TorusKnotGeometry(0.6, 0.18, 160, 24);
const material = new THREE.MeshPhysicalMaterial({
  color: 0xa3a3a3,
  emissive: 0xdbdbdb,
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
torusKnot.position.x = 1.5; 
scene.add(torusKnot);
let isMouseDown = false;
let rotationAxis = new THREE.Vector3(1, 1, 0).normalize();
const rotationSpeed = 0.002;

document.addEventListener('mousedown', () => {
  isMouseDown = true;
});

document.addEventListener('mouseup', () => {
  isMouseDown = false;
});

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
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});