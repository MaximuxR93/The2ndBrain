// src/components/ParticleUniverse.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  PARTICLE_COUNT,
  PARTICLE_COUNT_MOBILE,
  Formation,
  makeOrb,
  makeHourglass,
  makeHelix,
  makeTerrain,
  makeBlackHole,
  makeGalaxy,
  makeRandomsForCount,
} from "@/lib/formations";

export interface UniverseHandle {
  setMorph: (mix: number) => void;
  setFormation: (from: number, to: number) => void;
}

interface Props {
  handleRef: React.MutableRefObject<UniverseHandle | null>;
  formationRef: React.MutableRefObject<number>;
}

export default function ParticleUniverse({ handleRef, formationRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.error("[ParticleUniverse] WebGL renderer creation failed:", err);
      return;
    }

    renderer.setClearColor(0x050508, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.4, 11);

    const formations: Formation[] = [
      makeOrb(COUNT),
      makeHourglass(COUNT),
      makeHelix(COUNT),
      makeTerrain(COUNT),
      makeBlackHole(COUNT),
      makeGalaxy(COUNT),
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position",  new THREE.BufferAttribute(formations[0].positions.slice(), 3));
    geometry.setAttribute("positionA", new THREE.BufferAttribute(formations[0].positions.slice(), 3));
    geometry.setAttribute("positionB", new THREE.BufferAttribute(formations[0].positions.slice(), 3));
    geometry.setAttribute("aDelay",    new THREE.BufferAttribute(formations[0].delays.slice(), 1));
    geometry.setAttribute("aSize",     new THREE.BufferAttribute(formations[0].sizes.slice(), 1));
    geometry.setAttribute("aRandom",   new THREE.BufferAttribute(makeRandomsForCount(COUNT), 1));

    const uniforms = {
      uMix:        { value: 0 },
      uTime:       { value: 0 },
      uSpin:       { value: 0 },
      uMouse:      { value: new THREE.Vector3(0, 0, 1) },
      uDent:       { value: 1 },
      uWave:       { value: 1 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uSize:       { value: isMobile ? 0.55 : 0.7 },
    };

    const vertexShader = /* glsl */ `
      attribute vec3 positionA;
      attribute vec3 positionB;
      attribute float aDelay;
      attribute float aSize;
      attribute float aRandom;

      uniform float uMix;
      uniform float uTime;
      uniform float uSpin;
      uniform vec3  uMouse;
      uniform float uDent;
      uniform float uWave;
      uniform float uPixelRatio;
      uniform float uSize;

      varying float vWarm;
      varying float vBright;
      varying float vCore;

      float morphT(float m, float delay) {
        float t = clamp((m - delay * 0.6) / 0.4, 0.0, 1.0);
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
      }

      void main() {
        float t = morphT(uMix, aDelay);
        vec3 pos = mix(positionA, positionB, t);

        float c = cos(uSpin * (0.6 + aRandom * 0.4));
        float s = sin(uSpin * (0.6 + aRandom * 0.4));
        pos.xz = mat2(c, -s, s, c) * pos.xz;

        vec3 n = normalize(pos + vec3(0.0001));
        float wave =
          sin(pos.x * 2.1 + uTime * 0.9 + aRandom * 6.283) * 0.5 +
          sin(pos.y * 2.7 - uTime * 1.1 + aRandom * 6.283) * 0.35 +
          sin(pos.z * 2.4 + uTime * 0.7 + aRandom * 6.283) * 0.25;
        pos += n * wave * 0.06 * uWave;

        vec3 mouseDir = normalize(uMouse);
        float align = max(dot(n, mouseDir), 0.0);
        float dent = exp(-pow((1.0 - align) * 4.5, 2.0)) * uDent;
        pos -= n * dent * 0.5;

        // ── Color law: wide 3-stop spectrum ──
        // Warm at the top (y > 0) → magenta in the middle → cool at the bottom
        // yN runs from -1 (bottom) to +1 (top)
        float yN = clamp(pos.y / 3.2, -1.0, 1.0);

        // Blend factor for the warm end (top hemisphere)
        vWarm = smoothstep(-0.2, 0.8, yN);

        // Brightness: floor low enough that overlap doesn't clip to white
        // Most particles at 0.3–0.5, a few bright motes reach 1.0
        vBright = 0.25 + aRandom * 0.55 + dent * 0.7;

        // Core intensity — near zero except on the brightest motes
        vCore = smoothstep(0.75, 1.0, aRandom);

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);

        // ── Much smaller points ──
        // Base size ~4–8 px, not 20+. Tiny dots that read as dust.
        gl_PointSize = aSize * uSize * uPixelRatio * (14.0 / -mv.z);

        gl_Position = projectionMatrix * mv;
      }
    `;

    const fragmentShader = /* glsl */ `
      varying float vWarm;
      varying float vBright;
      varying float vCore;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        // Soft, wide falloff — no hard edges
        float alpha = smoothstep(0.5, 0.0, d);
        alpha = pow(alpha, 2.0);

        // ── 3-stop color palette ──
        // Bottom (cold): deep indigo
        vec3 cold = vec3(0.10, 0.14, 0.85);
        // Middle: violet
        vec3 mid  = vec3(0.55, 0.25, 0.95);
        // Top (warm): deep red-pink
        vec3 hot  = vec3(1.0, 0.10, 0.30);

        // Mix: below 0.5 → cold→mid, above 0.5 → mid→hot
        vec3 col;
        if (vWarm < 0.5) {
          col = mix(cold, mid, vWarm * 2.0);
        } else {
          col = mix(mid, hot, (vWarm - 0.5) * 2.0);
        }

        // Core glow — only on the brightest motes, subtle
        col += vec3(1.0, 0.75, 0.45) * smoothstep(0.15, 0.0, d) * vCore * 0.5;

        // Multiply by brightness, keep alpha
        gl_FragColor = vec4(col * vBright, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    handleRef.current = {
      setMorph: (mix) => { uniforms.uMix.value = mix; },
      setFormation: (from, to) => {
        const a = geometry.getAttribute("positionA") as THREE.BufferAttribute;
        const b = geometry.getAttribute("positionB") as THREE.BufferAttribute;
        const d = geometry.getAttribute("aDelay")    as THREE.BufferAttribute;
        const s = geometry.getAttribute("aSize")     as THREE.BufferAttribute;
        a.array.set(formations[from].positions);
        b.array.set(formations[to].positions);
        d.array.set(formations[to].delays);
        s.array.set(formations[to].sizes);
        a.needsUpdate = true;
        b.needsUpdate = true;
        d.needsUpdate = true;
        s.needsUpdate = true;
        uniforms.uMix.value = 0;
      },
    };

    const FORMATION_CAM = [
      { pos: [0, 0.4, 11],     look: [0, 0, 0],    spin: 0.08, wave: 1.0, dent: 1.0 },
      { pos: [0, 0.2, 10],     look: [0, 0, 0],    spin: 0.12, wave: 0.6, dent: 0.6 },
      { pos: [0.6, 0.4, 10.5], look: [0, 0, 0],    spin: 0.15, wave: 0.3, dent: 0.3 },
      { pos: [0, -1.2, 10],    look: [0, -0.6, 0], spin: 0.0,  wave: 0.0, dent: 0.0 },
      { pos: [1.2, 1.6, 10],   look: [0, 0, 0],    spin: 0.35, wave: 0.0, dent: 0.0 },
      { pos: [0, 2.4, 12],     look: [0, 0, 0],    spin: 0.25, wave: 0.0, dent: 0.0 },
    ];

    const camPos = new THREE.Vector3(
      FORMATION_CAM[0].pos[0], FORMATION_CAM[0].pos[1], FORMATION_CAM[0].pos[2]
    );
    const camLook = new THREE.Vector3(
      FORMATION_CAM[0].look[0], FORMATION_CAM[0].look[1], FORMATION_CAM[0].look[2]
    );
    const targetCamPos  = camPos.clone();
    const targetCamLook = camLook.clone();

    const mouseNDC = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const mouseWorld = new THREE.Vector3(0, 0, 1);
    const hitSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 3.2);
    const hitPoint = new THREE.Vector3();

    const onPointerMove = (e: PointerEvent) => {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onPointerMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };
    window.addEventListener("resize", onResize);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      renderer.render(scene, camera);
      return () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", onResize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    }

    let raf = 0;
    let lastT = performance.now();
    const damp = 0.08;

    const tick = () => {
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      lastT = now;

      uniforms.uTime.value += dt;

      const f = FORMATION_CAM[formationRef.current] ?? FORMATION_CAM[0];
      targetCamPos.set(f.pos[0], f.pos[1], f.pos[2]);
      targetCamLook.set(f.look[0], f.look[1], f.look[2]);

      camPos.lerp(targetCamPos, damp);
      camLook.lerp(targetCamLook, damp);

      const parallaxX = mouseNDC.x * 0.5;
      const parallaxY = mouseNDC.y * 0.3;
      camera.position.set(camPos.x + parallaxX, camPos.y + parallaxY, camPos.z);
      camera.lookAt(camLook);

      uniforms.uSpin.value += f.spin * dt;
      uniforms.uWave.value = f.wave;
      uniforms.uDent.value = f.dent;

      raycaster.setFromCamera(mouseNDC, camera);
      if (raycaster.ray.intersectSphere(hitSphere, hitPoint)) {
        mouseWorld.copy(hitPoint).normalize();
        uniforms.uMouse.value.copy(mouseWorld);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [handleRef, formationRef]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
      style={{ background: "#050508" }}
    />
  );
}