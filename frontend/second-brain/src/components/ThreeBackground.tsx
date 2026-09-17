"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A quiet, ambient particle field that lives behind every page.
 *
 * Design intent: one deliberate piece of motion for the whole product,
 * instead of hover flourishes scattered across every card. Particles drift
 * on their own and lean gently toward the cursor — never fast, never
 * center-stage, always readable as atmosphere rather than a distraction
 * from the document / chat content sitting on top of it.
 */
export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 12;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const COUNT = window.innerWidth < 768 ? 700 : 1600;
    const positions = new Float32Array(COUNT * 3);
    const basePositions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;
      speeds[i] = 0.15 + Math.random() * 0.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(124,92,252,0.6)");
    grad.addColorStop(1, "rgba(124,92,252,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(spriteCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.11,
      map: sprite,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const clock = new THREE.Clock();

    const render = () => {
      const t = clock.getElapsedTime();
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      if (!prefersReducedMotion) {
        for (let i = 0; i < COUNT; i++) {
          const idx = i * 3;
          const drift = Math.sin(t * speeds[i] + i) * 0.6;
          arr[idx] = basePositions[idx] + drift * 0.3;
          arr[idx + 1] = basePositions[idx + 1] + Math.cos(t * speeds[i] * 0.8 + i) * 0.4;
        }
        posAttr.needsUpdate = true;

        points.rotation.y += (pointer.x * 0.05 - points.rotation.y) * 0.02;
        points.rotation.x += (pointer.y * 0.03 - points.rotation.x) * 0.02;
        points.rotation.z = t * 0.01;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
