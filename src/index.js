import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect.js';

let scene, camera, renderer, sphere, controls, effect, clock;

//Fragment Shader Data
let FS = `uniform sampler2D textureMap;
    uniform sampler2D normalMap;
    
    varying vec2 vUv;
    varying mat3 tbn;
    varying vec3 vLightVector;
    
    void main() {
        vec3 normalCoordinate = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;

        vec3 normal = normalize(tbn * normalCoordinate.rgb);

        float intensity = max(0.07, dot(normal, vLightVector));
        vec4 lighting = vec4(intensity, intensity, intensity, 1.0);

        gl_FragColor = texture2D(textureMap, vUv) * lighting;
    }`;

//Vertex Shader Data
let VS = `attribute vec4 tangent;
    
    uniform vec2 uvScale;
    uniform vec3 lightPosition;

    varying vec2 vUv;
    varying mat3 tbn;
    varying vec3 vLightVector;

    void main() {
        vUv = uvScale * uv;

        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vTangent = normalize( normalMatrix * tangent.xyz );
        vec3 vBinormal = normalize(cross( vNormal, vTangent ) * tangent.w);
        tbn = mat3(vTangent, vBinormal, vNormal);

        vec4 lightVector = viewMatrix * vec4(lightPosition, 1.0);
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        vLightVector = normalize(lightVector.xyz - modelViewPosition.xyz);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

//Light Effect For Moon Phases
const light = {
  speed: 0.1,
  distance: 1000,
  position: new THREE.Vector3(0, 60, 70),
  orbit: function (center, time) {
    this.position.x = (center.x + this.distance) * Math.sin(time * -this.speed);

    this.position.z = (center.z + this.distance) * Math.cos(time * this.speed);
  },
};
//Loader
const manager = new THREE.LoadingManager(
  () => {
    // const loading = document.getElementById('')
    console.log('loaded');
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'none';
    const canvas = document.getElementsByTagName('canvas')[0];
    canvas.style.display = 'block';
  },
  () => {
    console.log('loading');
    const spinner = document.getElementById('spinner')
    spinner.style.display = 'block'
    const canvas = document.getElementsByTagName('canvas')[0]
    canvas.style.display = 'none'
  }
);

//Creation Of What Will Be Shown Once Page Is Rendered
function init() {
  //Scene Or Background
  scene = new THREE.Scene();

  let fov = 35;
  let aspect = window.innerWidth / window.innerHeight;
  let near = 1;
  let far = 65536;

  //Camera Or Field Of View
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 800);

  //Renderer Of Scene And Camera
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //Creation Of Sphere/Moon And Moon Textures/Materials
  const geometry = new THREE.SphereBufferGeometry(100, 50, 50);
  const textureMap = new THREE.TextureLoader(manager).load('moon.jpg');
  const normalMap = new THREE.TextureLoader().load('normal.jpg');
  const material = new THREE.ShaderMaterial({
    uniforms: {
      lightPosition: {
        type: 'v3',
        value: light.position,
      },
      textureMap: {
        type: 't',
        value: textureMap,
      },
      normalMap: {
        type: 't',
        value: normalMap,
      },
      uvScale: {
        type: 'v2',
        value: new THREE.Vector2(1.0, 1.0),
      },
    },
    vertexShader: VS,
    fragmentShader: FS,
  });

  sphere = new THREE.Mesh(geometry, material);
  BufferGeometryUtils.computeTangents(geometry);
  sphere.position.set(0, 0, 0);
  sphere.rotation.set(0, 180, 0);
  scene.add(sphere);

  //Moon Movement
  controls = new OrbitControls(camera, renderer.domElement);

  //3D Effect With 3D Glasses
  // effect = new AnaglyphEffect(renderer);
  // effect.setSize(window.innerWidth, window.innerHeight);

  //Moon Phase
  clock = new THREE.Clock();
}

function animate() {
  requestAnimationFrame(animate);

  sphere.rotation.y += 0.001;
  light.orbit(sphere.position, clock.getElapsedTime());

  renderer.render(scene, camera);
}

//Function For Future Add On Period Tracker + Moon Phase
function moonPhase() {}

//Interlacing Scene With Window
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

init();
setTimeout(() => {
  animate();
}, 2000);
