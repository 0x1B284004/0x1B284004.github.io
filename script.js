
const canvas = document.getElementById('threeCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const geometry = new THREE.TorusGeometry(1.5, 0.4, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.7, roughness: 0.2 });
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xff6600, 1);
pointLight.position.set(5,5,5);
scene.add(pointLight);
camera.position.z = 5;
const mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
function animate() {
    requestAnimationFrame(animate);
    torus.rotation.x += 0.01;
    torus.rotation.y += 0.01;
    torus.position.x = mouse.x * 2;
    torus.position.y = mouse.y * 2;

    renderer.render(scene, camera);
}
animate();
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
