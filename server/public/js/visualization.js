let scene, camera, renderer, cube;
const ws = new WebSocket('ws://localhost:3000');

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        wireframe: true 
    });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    camera.position.z = 5;
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    cube.rotation.x = data.gyro.x * 0.1;
    cube.rotation.y = data.gyro.y * 0.1;
    cube.rotation.z = data.gyro.z * 0.1;
};

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
animate();
