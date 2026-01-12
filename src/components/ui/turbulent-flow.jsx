import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const Component = ({ children }) => {
  const mountRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 vUv;

      #define PI 3.14159265359

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float hash3(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }

      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 permute(vec4 x) {
        return mod289(((x*34.0)+1.0)*x);
      }

      vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for(int i = 0; i < 5; i++) {
          value += amplitude * snoise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }

      float stars(vec2 uv, float time) {
        float stars = 0.0;

        for(float i = 0.0; i < 4.0; i++) {
          vec2 gridUv = uv * (50.0 + i * 30.0);
          vec2 gridId = floor(gridUv);
          vec2 gridFract = fract(gridUv);

          float h = hash(gridId + i * 100.0);

          if(h > 0.96) {
            vec2 starPos = vec2(hash(gridId + vec2(1.0, 0.0)), hash(gridId + vec2(0.0, 1.0)));
            float d = length(gridFract - starPos);

            float twinkle = sin(time * (2.0 + h * 4.0) + h * 100.0) * 0.5 + 0.5;
            float brightness = h * 0.7 + 0.3;
            float size = 0.02 + h * 0.03;

            float star = smoothstep(size, 0.0, d) * brightness * (0.5 + twinkle * 0.5);
            stars += star;
          }
        }

        return stars;
      }

      float bigStars(vec2 uv, float time) {
        float stars = 0.0;

        vec2 gridUv = uv * 15.0;
        vec2 gridId = floor(gridUv);
        vec2 gridFract = fract(gridUv);

        float h = hash(gridId);

        if(h > 0.92) {
          vec2 starPos = vec2(hash(gridId + vec2(1.0, 0.0)), hash(gridId + vec2(0.0, 1.0)));
          float d = length(gridFract - starPos);

          float twinkle = sin(time * 1.5 + h * 50.0) * 0.3 + 0.7;

          float core = smoothstep(0.04, 0.0, d);
          float glow = smoothstep(0.15, 0.0, d) * 0.3;

          float rays = 0.0;
          for(float a = 0.0; a < 4.0; a++) {
            float angle = a * PI * 0.5;
            vec2 dir = vec2(cos(angle), sin(angle));
            float rayD = abs(dot(gridFract - starPos, dir));
            float perpD = length((gridFract - starPos) - dir * dot(gridFract - starPos, dir));
            rays += smoothstep(0.02, 0.0, perpD) * smoothstep(0.2, 0.0, rayD) * 0.3;
          }

          stars = (core + glow + rays) * twinkle;
        }

        return stars;
      }

      vec3 nebula(vec2 uv, float time) {
        vec3 color = vec3(0.0);

        float n1 = fbm(vec3(uv * 2.0, time * 0.05));
        float n2 = fbm(vec3(uv * 3.0 + 100.0, time * 0.03));
        float n3 = fbm(vec3(uv * 1.5 + 200.0, time * 0.04));

        vec3 pink = vec3(0.8, 0.2, 0.5);
        vec3 blue = vec3(0.1, 0.3, 0.8);
        vec3 cyan = vec3(0.1, 0.6, 0.7);
        vec3 orange = vec3(0.9, 0.4, 0.1);

        color += pink * smoothstep(0.0, 0.6, n1) * 0.4;
        color += blue * smoothstep(-0.2, 0.5, n2) * 0.5;
        color += cyan * smoothstep(0.1, 0.7, n3) * 0.3;
        color += orange * smoothstep(0.2, 0.8, n1 * n2) * 0.2;

        return color;
      }

      vec3 galaxy(vec2 uv, vec2 center, float time, float size, float rotation) {
        vec2 p = uv - center;

        float angle = atan(p.y, p.x) + rotation;
        float dist = length(p);

        float spiral = sin(angle * 2.0 - dist * 15.0 / size + time * 0.2) * 0.5 + 0.5;

        float core = exp(-dist * 8.0 / size);
        float arms = spiral * exp(-dist * 4.0 / size) * smoothstep(size * 0.8, size * 0.1, dist);

        float galaxy = core * 0.8 + arms * 0.4;

        vec3 coreColor = vec3(1.0, 0.9, 0.7);
        vec3 armColor = vec3(0.4, 0.5, 0.9);

        return mix(armColor, coreColor, core) * galaxy;
      }

      void main() {
        vec2 uv = vUv;
        vec2 st = (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y);

        float time = u_time * 0.3;

        vec3 color = vec3(0.01, 0.01, 0.03);

        vec3 nebulaColor = nebula(uv, time);
        color += nebulaColor * 0.6;

        color += galaxy(st, vec2(0.2, 0.15), time, 0.25, time * 0.1) * 0.4;
        color += galaxy(st, vec2(-0.3, -0.2), time, 0.15, -time * 0.08 + 1.0) * 0.25;
        color += galaxy(st, vec2(0.35, -0.25), time, 0.12, time * 0.05 + 2.0) * 0.2;

        float starField = stars(uv, time);
        color += vec3(starField) * vec3(1.0, 0.95, 0.9);

        float brightStars = bigStars(uv, time);
        color += vec3(brightStars) * vec3(0.9, 0.95, 1.0);

        float dust = fbm(vec3(uv * 5.0, time * 0.02)) * 0.5 + 0.5;
        color *= 0.8 + dust * 0.4;

        float shootingStar = 0.0;
        float shootTime = mod(time * 0.5, 4.0);
        if(shootTime < 0.5) {
          vec2 shootStart = vec2(0.8, 0.9);
          vec2 shootEnd = vec2(0.2, 0.4);
          vec2 shootPos = mix(shootStart, shootEnd, shootTime * 2.0);
          vec2 shootDir = normalize(shootEnd - shootStart);

          float along = dot(uv - shootStart, shootDir);
          float perp = length((uv - shootStart) - shootDir * along);

          float trail = smoothstep(0.02, 0.0, perp) *
                        smoothstep(0.0, 0.1, along) *
                        smoothstep(shootTime * 2.0 + 0.2, shootTime * 2.0 - 0.1, along);

          shootingStar = trail * (1.0 - shootTime * 2.0);
        }
        color += vec3(shootingStar) * vec3(1.0, 0.9, 0.8);

        float vignette = 1.0 - length(uv - 0.5) * 0.8;
        vignette = smoothstep(0.0, 1.0, vignette);
        color *= vignette;

        color = pow(color, vec3(0.9));

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      }
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const animate = () => {
      material.uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    clock.start();
    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      material.uniforms.u_resolution.value.set(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
      {children && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Component;
