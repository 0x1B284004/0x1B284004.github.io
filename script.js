
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
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true,
    antialias: true 
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
camera.position.z = 5;
const torusGeometry = new THREE.TorusGeometry(1.5, 0.5, 16, 100);
const torusMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6b00,
    emissive: 0xff6b00,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.8,
    wireframe: false
});
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
scene.add(torus);
const pointLight = new THREE.PointLight(0xff6b00, 2, 100);
pointLight.position.set(0, 0, 3);
scene.add(pointLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    
    targetRotationX = mouseY * 0.5;
    targetRotationY = mouseX * 0.5;
    
    const hue = ((e.clientX / window.innerWidth) * 0.1) + 0.08;
    const color = new THREE.Color().setHSL(hue, 1, 0.5);
    torusMaterial.color = color;
    torusMaterial.emissive = color;
    pointLight.color = color;
});
function animate() {
    requestAnimationFrame(animate);
    torus.rotation.x += (targetRotationX - torus.rotation.x) * 0.05;
    torus.rotation.y += (targetRotationY - torus.rotation.y) * 0.05;
    torus.rotation.x += 0.003;
    torus.rotation.y += 0.005;
    torus.position.y = Math.sin(Date.now() * 0.001) * 0.2;
    
    renderer.render(scene, camera);
}

animate();
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const bars = document.querySelectorAll('.bar');
function animateBars() {
    bars.forEach((bar, index) => {
        const randomHeight = Math.random() * 50 + 10;
        bar.style.height = randomHeight + 'px';
    });
}
setInterval(animateBars, 100);