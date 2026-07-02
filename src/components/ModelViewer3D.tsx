"use client";

import { Maximize2, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import type { OrbitControls as OrbitControlsType } from "three/examples/jsm/controls/OrbitControls.js";

type ModelViewer3DProps = {
  modelUrl: string;
};

export function ModelViewer3D({ modelUrl }: ModelViewer3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const initialCameraRef = useRef<THREE.Vector3 | null>(null);
  const initialTargetRef = useRef<THREE.Vector3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    let animationFrame = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let modelRoot: THREE.Object3D | null = null;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      const host = hostRef.current;
      if (!host) return;

      try {
        setLoading(true);
        setError("");

        const THREE_MODULE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

        scene = new THREE_MODULE.Scene();
        scene.background = new THREE_MODULE.Color("#050505");

        const camera = new THREE_MODULE.PerspectiveCamera(40, 1, 0.1, 1000);
        camera.position.set(3.2, 2.2, 4.2);
        cameraRef.current = camera;

        renderer = new THREE_MODULE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE_MODULE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.domElement.className = "h-full w-full";
        host.appendChild(renderer.domElement);

        const ambient = new THREE_MODULE.AmbientLight("#ffffff", 1.6);
        const key = new THREE_MODULE.DirectionalLight("#f5d58d", 2.1);
        key.position.set(4, 5, 6);
        const rim = new THREE_MODULE.DirectionalLight("#ffffff", 0.7);
        rim.position.set(-4, 2, -3);
        scene.add(ambient, key, rim);

        controlsRef.current = new OrbitControls(camera, renderer.domElement);
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.08;
        controlsRef.current.minDistance = 1.2;
        controlsRef.current.maxDistance = 18;

        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(modelUrl);
        if (!mounted || !scene) return;

        modelRoot = gltf.scene;
        scene.add(modelRoot);

        const box = new THREE_MODULE.Box3().setFromObject(modelRoot);
        const center = box.getCenter(new THREE_MODULE.Vector3());
        const size = box.getSize(new THREE_MODULE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z) || 1;
        modelRoot.position.sub(center);

        camera.position.set(maxSize * 1.5, maxSize * 0.9, maxSize * 1.8);
        camera.near = maxSize / 100;
        camera.far = maxSize * 100;
        camera.updateProjectionMatrix();
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        initialCameraRef.current = camera.position.clone();
        initialTargetRef.current = controlsRef.current.target.clone();

        function resize() {
          if (!host || !renderer || !cameraRef.current) return;
          const width = Math.max(host.clientWidth, 1);
          const height = Math.max(host.clientHeight, 1);
          renderer.setSize(width, height, false);
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }

        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        function animate() {
          if (!renderer || !scene || !cameraRef.current) return;
          controlsRef.current?.update();
          renderer.render(scene, cameraRef.current);
          animationFrame = window.requestAnimationFrame(animate);
        }

        animate();
        setLoading(false);
      } catch {
        if (mounted) {
          setError("Nao foi possivel carregar o modelo 3D.");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      controlsRef.current?.dispose();
      controlsRef.current = null;

      if (modelRoot) {
        modelRoot.traverse((object) => {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          const material = mesh.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material?.dispose();
          }
        });
      }

      renderer?.dispose();
      if (renderer?.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  function resetCamera() {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const initialCamera = initialCameraRef.current;
    const initialTarget = initialTargetRef.current;

    if (!camera || !controls || !initialCamera || !initialTarget) return;
    camera.position.copy(initialCamera);
    controls.target.copy(initialTarget);
    controls.update();
  }

  async function enterFullscreen() {
    await hostRef.current?.requestFullscreen?.();
  }

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
      <div ref={hostRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(217,181,111,0.14),transparent_36%)]" />

      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <button
          className="rounded-full border border-white/10 bg-black/55 p-3 text-white/80 backdrop-blur transition hover:border-[#d9b56f] hover:text-[#d9b56f]"
          onClick={resetCamera}
          title="Resetar camera"
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          className="rounded-full border border-white/10 bg-black/55 p-3 text-white/80 backdrop-blur transition hover:border-[#d9b56f] hover:text-[#d9b56f]"
          onClick={enterFullscreen}
          title="Tela cheia"
          type="button"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {(loading || error) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-center backdrop-blur">
          <div>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border border-[#d9b56f]/20 border-t-[#d9b56f]" />
            <p className="text-sm font-semibold text-white">
              {error || "Carregando experiencia 3D..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
