import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const palette = ['#38bdf8', '#0ea5e9', '#22d3ee', '#a855f7', '#6366f1'];

const THREE_ENTRY = 'https://esm.sh/three@0.161.0?target=es2022&exports=Scene,FogExp2,PerspectiveCamera,WebGLRenderer,AmbientLight,DirectionalLight,PointLight,Group,IcosahedronGeometry,MeshStandardMaterial,Mesh,Vector3,BufferGeometry,LineBasicMaterial,Line,BufferAttribute,PointsMaterial,Points,Clock,SRGBColorSpace&external=';

const createConnection = (THREE, start, end, color) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.22,
        linewidth: 1,
    });
    const line = new THREE.Line(geometry, material);
    line.userData = {
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.4,
    };
    return line;
};

export default function CodeStudioScene({ className = '' }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return undefined;

        let cleanup = () => {};
        let cancelled = false;

        const loadThree = async () => {
            try {
                const module = await import(THREE_ENTRY);
                if (cancelled) return;

                const THREE = module.default ?? module;

                const width = mount.clientWidth || 600;
                const height = mount.clientHeight || 420;

                const scene = new THREE.Scene();
                scene.fog = new THREE.FogExp2(0x020617, 0.065);

                const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
                camera.position.set(-4, 2, 24);

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
                renderer.setSize(width, height);
                if (renderer.outputColorSpace && THREE.SRGBColorSpace) {
                    renderer.outputColorSpace = THREE.SRGBColorSpace;
                }
                mount.appendChild(renderer.domElement);

                const ambientLight = new THREE.AmbientLight(0x60a5fa, 0.5);
                scene.add(ambientLight);
                const keyLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
                keyLight.position.set(8, 10, 14);
                scene.add(keyLight);
                const rimLight = new THREE.PointLight(0x22d3ee, 0.9, 60);
                rimLight.position.set(-12, -6, 8);
                scene.add(rimLight);

                const bubbleGroup = new THREE.Group();
                scene.add(bubbleGroup);

                const nodes = [];
                for (let index = 0; index < 14; index += 1) {
                    const color = palette[index % palette.length];
                    const geometry = new THREE.IcosahedronGeometry(0.6 + Math.random() * 0.4, 1);
                    const material = new THREE.MeshStandardMaterial({
                        color: new THREE.Color(color).multiplyScalar(0.6),
                        transparent: true,
                        opacity: 0.45,
                        emissive: new THREE.Color(color).multiplyScalar(0.45),
                        emissiveIntensity: 1.1,
                        roughness: 0.25,
                        metalness: 0.15,
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10);
                    mesh.userData = {
                        baseY: mesh.position.y,
                        floatSpeed: 0.4 + Math.random() * 0.5,
                        floatAmplitude: 0.9 + Math.random() * 1.2,
                        rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
                        rotationSpeed: 0.12 + Math.random() * 0.18,
                    };
                    bubbleGroup.add(mesh);
                    nodes.push(mesh);
                }

                const connectionGroup = new THREE.Group();
                scene.add(connectionGroup);
                const connections = [];
                for (let index = 0; index < 16; index += 1) {
                    const start = nodes[Math.floor(Math.random() * nodes.length)];
                    const end = nodes[Math.floor(Math.random() * nodes.length)];
                    if (!start || !end || start === end) {
                        continue;
                    }
                    const connection = createConnection(THREE, start.position.clone(), end.position.clone(), '#0ea5e9');
                    connectionGroup.add(connection);
                    connections.push(connection);
                }

                const particleCount = 420;
                const particleGeometry = new THREE.BufferGeometry();
                const particlePositions = new Float32Array(particleCount * 3);
                const particleVelocities = new Float32Array(particleCount);
                for (let index = 0; index < particleCount; index += 1) {
                    particlePositions[index * 3] = (Math.random() - 0.5) * 28;
                    particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 18;
                    particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 18;
                    particleVelocities[index] = 0.25 + Math.random() * 0.6;
                }
                particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
                const particleMaterial = new THREE.PointsMaterial({
                    color: 0x38bdf8,
                    size: 0.085,
                    transparent: true,
                    opacity: 0.55,
                    depthWrite: false,
                });
                const particles = new THREE.Points(particleGeometry, particleMaterial);
                scene.add(particles);

                let animationFrameId;
                const clock = new THREE.Clock();

                const animate = () => {
                    const elapsed = clock.getElapsedTime();
                    bubbleGroup.children.forEach((mesh) => {
                        const { baseY, floatSpeed, floatAmplitude, rotationAxis, rotationSpeed } = mesh.userData;
                        mesh.position.y = baseY + Math.sin(elapsed * floatSpeed) * floatAmplitude;
                        mesh.quaternion.setFromAxisAngle(rotationAxis, elapsed * rotationSpeed);
                    });
                    connections.forEach((line) => {
                        const { phase, speed } = line.userData;
                        line.material.opacity = 0.15 + 0.14 * Math.sin(elapsed * speed + phase);
                    });
                    const positions = particleGeometry.attributes.position.array;
                    for (let idx = 0; idx < particleCount; idx += 1) {
                        positions[idx * 3 + 1] += Math.sin(elapsed * particleVelocities[idx]) * 0.002;
                    }
                    particleGeometry.attributes.position.needsUpdate = true;
                    particles.rotation.y = elapsed * 0.08;
                    particles.rotation.x = elapsed * 0.02;
                    renderer.render(scene, camera);
                    animationFrameId = requestAnimationFrame(animate);
                };

                animate();

                const handleResize = () => {
                    if (!mount) return;
                    const nextWidth = mount.clientWidth || width;
                    const nextHeight = mount.clientHeight || height;
                    camera.aspect = nextWidth / nextHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(nextWidth, nextHeight);
                };

                window.addEventListener('resize', handleResize);

                cleanup = () => {
                    cancelAnimationFrame(animationFrameId);
                    window.removeEventListener('resize', handleResize);
                    bubbleGroup.children.forEach((mesh) => {
                        mesh.geometry.dispose();
                        mesh.material.dispose();
                    });
                    connections.forEach((line) => {
                        line.geometry.dispose();
                        line.material.dispose();
                    });
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                    renderer.dispose();
                    if (renderer.domElement.parentNode === mount) {
                        mount.removeChild(renderer.domElement);
                    }
                };
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.error('Failed to load Three.js studio backdrop', error);
                }
            }
        };

        loadThree();

        return () => {
            cancelled = true;
            cleanup();
        };
    }, []);

    return <div ref={mountRef} className={`pointer-events-none ${className}`} aria-hidden="true" />;
}

CodeStudioScene.propTypes = {
    className: PropTypes.string,
};
