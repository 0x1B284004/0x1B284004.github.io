import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

let scene, torusKnot, analyser, audio, dataArray, isPaused = false, isPlaying = false;
let camera, renderer;

document.body.addEventListener('mousemove', e => {
  document.body.style.setProperty('--cursorX', `${e.clientX}px`);
  document.body.style.setProperty('--cursorY', `${e.clientY}px`);
});

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
typewriterElement.addEventListener('click', () => changeSection('home'));

function animateColor(colorObj, targetColor, duration) {
  const startColor = colorObj.clone();
  const endColor = new THREE.Color(targetColor);
  const startTime = Date.now();
  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = progress < 0.5 ? 2*progress*progress : 1-Math.pow(-2*progress+2,2)/2;
    colorObj.lerpColors(startColor,endColor,eased);
    if(progress<1) requestAnimationFrame(update);
  }
  update();
}

function animateCSSColor(property,startColor,endColor,duration){
  const start={r:parseInt(startColor.slice(1,3),16),g:parseInt(startColor.slice(3,5),16),b:parseInt(startColor.slice(5,7),16)};
  const end={r:parseInt(endColor.slice(1,3),16),g:parseInt(endColor.slice(3,5),16),b:parseInt(endColor.slice(5,7),16)};
  const startTime=Date.now();
  function update(){
    const elapsed=Date.now()-startTime;
    const progress=Math.min(elapsed/duration,1);
    const eased=progress<0.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2;
    const r=Math.round(start.r+(end.r-start.r)*eased);
    const g=Math.round(start.g+(end.g-start.g)*eased);
    const b=Math.round(start.b+(end.b-start.b)*eased);
    document.documentElement.style.setProperty(property,`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
    if(progress<1) requestAnimationFrame(update);
  }
  update();
}

const sections={
  home:{start:'#2c2a17',end:'#FFCC57',accent:'#FFCC57',h1:'#FFCC57',torusColor:0xa3a3a3,torusEmissive:0xffcc57,fog:0xd1d1d1},
  contacts:{start:'#1a0a2e',end:'#9c27b0',accent:'#bb86fc',h1:'#bb86fc',torusColor:0x9c27b0,torusEmissive:0xbb86fc,fog:0x1a0a2e},
  about:{start:'#1a0a0a',end:'#ff4444',accent:'#ff6b6b',h1:'#ff6b6b',torusColor:0xcc2222,torusEmissive:0xff6b6b,fog:0x1a0a0a},
  skills:{start:'#1a0a2e',end:'#9d4edd',accent:'#c77dff',h1:'#c77dff',torusColor:0x7209b7,torusEmissive:0xc77dff,fog:0x1a0a2e},
  projects:{start:'#0a1a2e',end:'#4a90e2',accent:'#64b5f6',h1:'#64b5f6',torusColor:0x2171c9,torusEmissive:0x64b5f6,fog:0x0a1a2e},
  tips:{start:'#004b23',end:'#38ef7d',accent:'#57cc99',h1:'#57cc99',torusColor:0x007f5f,torusEmissive:0x57cc99,fog:0x004b23}
};

function changeSection(sectionName){
  if(!sections[sectionName]) return;
  const s=sections[sectionName];
  document.body.dataset.section=sectionName;
  const currentStart=getComputedStyle(document.documentElement).getPropertyValue('--gradient-start').trim();
  const currentEnd=getComputedStyle(document.documentElement).getPropertyValue('--gradient-end').trim();
  const currentAccent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const currentUnderline=getComputedStyle(document.documentElement).getPropertyValue('--underline').trim();
  animateCSSColor('--gradient-start',currentStart,s.start,1200);
  animateCSSColor('--gradient-end',currentEnd,s.end,1200);
  animateCSSColor('--accent',currentAccent,s.accent,1200);
  animateCSSColor('--h1-color',currentAccent,s.h1,1200);
  animateCSSColor('--underline',currentUnderline,s.accent,1200);
  document.querySelectorAll('.section').forEach(el=>el.classList.remove('active'));
  document.getElementById(`section-${sectionName}`).classList.add('active');
  document.querySelector('#page-content').classList.add('active');
  if(torusKnot){
    animateColor(torusKnot.material.color,s.torusColor,1200);
    animateColor(torusKnot.material.emissive,s.torusEmissive,1200);
    animateColor(scene.fog.color,s.fog,1200);
  }
}

document.body.addEventListener('click',e=>{
  const link=e.target.closest('.projects a');
  if(link){e.preventDefault();changeSection(link.dataset.section);}
});

const audioContext=new(window.AudioContext||window.webkitAudioContext)();
analyser=audioContext.createAnalyser();
analyser.fftSize=256;
const bufferLength=analyser.frequencyBinCount;
dataArray=new Uint8Array(bufferLength);
audio=new Audio('assets/audio/background.mp3');
audio.loop=true;
audio.volume=1;

function fadeAudio(targetVolume,duration){
  const startVolume=audio.volume;
  const startTime=Date.now();
  function updateVolume(){
    const elapsed=Date.now()-startTime;
    const progress=Math.min(elapsed/duration,1);
    audio.volume=startVolume+(targetVolume-startVolume)*progress;
    if(progress<1) requestAnimationFrame(updateVolume);
  }
  updateVolume();
}

const visualizer=document.getElementById('audio-visualizer');
for(let i=0;i<3;i++){
  const circle=document.createElement('div');
  circle.classList.add('circle');
  circle.style.right=`${i*30}px`;
  visualizer.appendChild(circle);
}

let source=null,audioInitialized=false;
document.addEventListener('click',e=>{
  if(!audioInitialized&&!e.target.closest('#audio-visualizer')&&!e.target.closest('.projects a')){
    if(audioContext.state==='suspended') audioContext.resume();
    if(!source){source=audioContext.createMediaElementSource(audio);source.connect(analyser);analyser.connect(audioContext.destination);}
    audio.play().then(()=>{isPlaying=true;isPaused=false;animateCircles();});
    audioInitialized=true;
  }
});

function animateCircles(){
  const circles=document.querySelectorAll('.circle');
  function loop(){
    if(!isPaused&&isPlaying){
      analyser.getByteFrequencyData(dataArray);
      const avg=dataArray.reduce((s,v)=>s+v,0)/bufferLength;
      const scale=0.5+(avg/255)*2.5;
      circles.forEach((c,idx)=>c.style.transform=`scale(${scale*(1-idx*0.2)})`);
    }
    requestAnimationFrame(loop);
  }
  loop();
}

visualizer.addEventListener('click',()=>{
  isPaused=!isPaused;
  visualizer.classList.toggle('paused',isPaused);
  if(isPaused){
    fadeAudio(0,500);
    setTimeout(()=>{audio.pause();document.querySelectorAll('.circle').forEach(c=>c.style.transform='scale(0.5)');},500);
  }else{
    audio.volume=0;
    audio.play().then(()=>{fadeAudio(1,500);animateCircles();});
  }
});

function initTorus(){
  const canvas=document.getElementById('webgl-canvas');
  if(!canvas){
    console.error('Canvas element not found');
    return;
  }
  canvas.style.display='block';
  
  // Configuration de la scène
  scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xd1d1d1,1,6);
  
  // Lumières
  scene.add(new THREE.AmbientLight(0xffffff,0.5));
  const dirLight=new THREE.DirectionalLight(0xffffff,0.5);
  dirLight.position.set(1,1,1);
  scene.add(dirLight);
  
  // Configuration de la caméra - CENTRÉ VERTICALEMENT ET HORIZONTALEMENT
  camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
  camera.position.set(0,0,1.9);
  camera.lookAt(0,0,0);
  
  // Renderer - Plein écran avec canvas positionné
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  
  // Calculer les dimensions exactes
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // S'assurer que le canvas est bien dimensionné
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  // Création du torus knot - POSITIONNÉ AU CENTRE EXACT
  const geometry=new THREE.TorusKnotGeometry(0.6,0.18,160,24);
  const material=new THREE.MeshPhysicalMaterial({
    color:0xa3a3a3,
    emissive:0xffcc57,
    roughness:0,
    metalness:1,
    wireframe:true,
    transparent:true,
    opacity:0.9,
    side:THREE.DoubleSide
  });
  torusKnot=new THREE.Mesh(geometry,material);
  torusKnot.position.set(0,0,0);
  scene.add(torusKnot);
  
  // Interaction souris
  let isMouseDown=false;
  let rotationAxis=new THREE.Vector3(1,1,0).normalize();
  
  document.addEventListener('mousedown',()=>isMouseDown=true);
  document.addEventListener('mouseup',()=>isMouseDown=false);
  document.addEventListener('mousemove',e=>{
    if(isMouseDown){
      const dx=(e.clientX-window.innerWidth/2)/window.innerWidth;
      const dy=(e.clientY-window.innerHeight/2)/window.innerHeight;
      const target=new THREE.Vector3(dy*2,dx*2,0).normalize();
      rotationAxis.lerp(target,0.1);
    }
  });
  
  // Animation loop
  function animate(){
    requestAnimationFrame(animate);
    
    // Rotation
    const q=new THREE.Quaternion().setFromAxisAngle(rotationAxis,0.001);
    torusKnot.quaternion.multiply(q);
    if(!isMouseDown) rotationAxis.lerp(new THREE.Vector3(1,1,0).normalize(),0.02);
    
    // Animation audio
    if(isPlaying&&!isPaused){
      analyser.getByteFrequencyData(dataArray);
      const avg=dataArray.reduce((s,v)=>s+v,0)/bufferLength;
      const targetScale=0.78+(avg/255)*0.04;
      torusKnot.scale.setScalar(THREE.MathUtils.lerp(torusKnot.scale.x,targetScale,0.05));
    }else{
      torusKnot.scale.setScalar(THREE.MathUtils.lerp(torusKnot.scale.x,0.8,0.05));
    }
    
    renderer.render(scene,camera);
  }
  animate();
  
  // Responsive
  window.addEventListener('resize',()=>{
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  });
}

window.addEventListener('load',()=>{
  initTorus();
  changeSection('home');
});