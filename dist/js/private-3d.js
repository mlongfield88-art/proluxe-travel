/**
 * Procedural Three.js envelope for the /private page.
 *
 * Phase 1: scaffold with procedural geometry, single-colour PBR
 * materials, two directional lights. Letter content stays as HTML
 * below the canvas. Falls back to the CSS envelope when WebGL is
 * unavailable.
 *
 * Phase 2 (next session): drop a stock GLB envelope from Sketchfab
 * into dist/img/3d/, paper texture maps from ambientCG into
 * dist/img/textures/, an HDRi from polyhaven into dist/img/hdri/,
 * and swap the procedural geometry for the model + load the texture
 * maps + use the HDRi as scene environment for cinematic lighting.
 *
 * No bundler. Runs as an ES module via importmap declared in the
 * page head.
 */

import * as THREE from 'three';

(function () {

  // -----------------------------------------------------------------
  // 1. WebGL feature detection. Bail to CSS fallback if unavailable.
  // -----------------------------------------------------------------
  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  if (!hasWebGL()) return;

  // -----------------------------------------------------------------
  // 2. Wait for DOM + GSAP to be ready before initialising.
  // -----------------------------------------------------------------
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(init);

  function init() {
    const canvas = document.getElementById('envelopeCanvas');
    const stage = document.getElementById('envelope3DStage');
    const section = document.getElementById('envelopeReveal');
    if (!canvas || !stage || !section) return;

    document.body.classList.add('has-webgl');

    let stageWidth = stage.clientWidth || 460;
    let stageHeight = stage.clientHeight || 300;

    // -----------------------------------------------------------------
    // 3. Renderer. Transparent background lets the cream page show.
    //    ACES tone mapping gives the cinematic film-stock look that
    //    Polyhaven HDRis are colour-graded for.
    // -----------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(stageWidth, stageHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // -----------------------------------------------------------------
    // 4. Scene + camera. 35mm-equivalent FOV reads as a portrait lens,
    //    flatters paper objects rather than wide-angle distortion.
    // -----------------------------------------------------------------
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(32, stageWidth / stageHeight, 0.1, 100);
    camera.position.set(0, 0.4, 7.6);
    camera.lookAt(0, 0, 0);

    // -----------------------------------------------------------------
    // 5. Lights. Three-point setup approximating a luxury invitation
    //    photographed in a softbox studio. Phase 2 swaps this for an
    //    HDRi environment via PMREMGenerator + scene.environment.
    // -----------------------------------------------------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const key = new THREE.DirectionalLight(0xfff2dc, 1.6);
    key.position.set(2.4, 3.6, 4.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0001;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc9d4f5, 0.45);
    fill.position.set(-3.5, 1.2, 2.5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(0, 2, -3);
    scene.add(rim);

    // -----------------------------------------------------------------
    // 6. Materials. Olive cardstock, cream interior, burgundy wax.
    //    Phase 2: replace the colour-only Standard materials with
    //    MeshPhysicalMaterial driven by ambientCG paper texture maps
    //    (basecolor, normal, roughness, ambient occlusion).
    // -----------------------------------------------------------------
    const COLOURS = {
      olive: 0x424632,
      oliveLight: 0x4e5240,
      cream: 0xece4d2,
      wax: 0x8a1f24,
      waxDark: 0x5e1015,
    };

    const cardstockBack = new THREE.MeshStandardMaterial({
      color: COLOURS.olive,
      roughness: 0.86,
      metalness: 0.02,
    });

    // Flap is double-sided so we can show olive outside, cream inside
    // by using two stacked meshes back-to-back. Two materials, one
    // mesh each, offset by 0.001 in z.
    const flapOuterMat = new THREE.MeshStandardMaterial({
      color: COLOURS.olive,
      roughness: 0.86,
      metalness: 0.02,
      side: THREE.FrontSide,
    });
    const flapInnerMat = new THREE.MeshStandardMaterial({
      color: COLOURS.cream,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    const waxMat = new THREE.MeshStandardMaterial({
      color: COLOURS.wax,
      roughness: 0.4,
      metalness: 0.06,
      transparent: true,
      opacity: 1,
    });

    // -----------------------------------------------------------------
    // 7. Envelope geometry. Procedural primitives standing in for the
    //    Phase 2 GLB import. Group hierarchy:
    //
    //      envelope
    //        body         (BoxGeometry)
    //        seal         (CylinderGeometry)
    //        flapPivot    (Group, rotates around top edge)
    //          flapOuter  (BufferGeometry triangle, olive)
    //          flapInner  (BufferGeometry triangle, cream, behind)
    //
    //    The flap pivot sits at the top edge of the body so rotation
    //    around X opens the flap upwards/backwards.
    // -----------------------------------------------------------------
    const envelope = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(4.6, 3, 0.06);
    const body = new THREE.Mesh(bodyGeo, cardstockBack);
    body.castShadow = true;
    body.receiveShadow = true;
    envelope.add(body);

    function makeFlapGeometry() {
      const geo = new THREE.BufferGeometry();
      // Vertices placed so the top edge is at y=0 (rotation pivot)
      // and the V tip points down to y=-1.95.
      const verts = new Float32Array([
        -2.3, 0, 0,
         2.3, 0, 0,
         0, -1.95, 0,
      ]);
      const uvs = new Float32Array([
        0, 1,
        1, 1,
        0.5, 0,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex([0, 1, 2]);
      geo.computeVertexNormals();
      return geo;
    }

    const flapPivot = new THREE.Group();
    flapPivot.position.set(0, 1.5, 0.031);

    const flapOuter = new THREE.Mesh(makeFlapGeometry(), flapOuterMat);
    flapOuter.castShadow = true;
    flapPivot.add(flapOuter);

    // Inner face: same triangle, flipped to face the other way.
    // Rotated 180° around its X axis so its front faces opposite.
    const flapInner = new THREE.Mesh(makeFlapGeometry(), flapInnerMat);
    flapInner.position.z = -0.005;
    flapInner.rotation.y = Math.PI; // flip horizontally so its normal faces back
    flapPivot.add(flapInner);

    envelope.add(flapPivot);

    // Wax seal. Cylinder rotated to face camera, sits slightly in
    // front of the envelope body so it appears to bridge body+flap.
    const sealGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.05, 48, 1);
    const seal = new THREE.Mesh(sealGeo, waxMat);
    seal.rotation.x = Math.PI / 2;
    seal.position.set(0, 0, 0.06);
    seal.castShadow = true;
    envelope.add(seal);

    // Slight camera-up tilt on the whole envelope so the lighting
    // reads from above. About 4 degrees.
    envelope.rotation.x = -0.07;

    scene.add(envelope);

    // -----------------------------------------------------------------
    // 8. Animation timeline. Driven by GSAP if loaded, otherwise a
    //    minimal RAF fallback. Phase 2: replace this with GSAP
    //    ScrollTrigger so the animation scrubs against scroll
    //    position rather than firing once on enter.
    // -----------------------------------------------------------------
    const gsap = window.gsap;
    let opened = false;

    function openEnvelope() {
      if (opened) return;
      opened = true;

      if (gsap) {
        const tl = gsap.timeline();

        // Seal cracks: scales down, drops, rotates, fades.
        tl.to(seal.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 0.5, ease: 'power2.in' }, 0)
          .to(seal.position, { z: 0.4, y: -0.3, duration: 0.55, ease: 'power2.in' }, 0)
          .to(seal.rotation, { z: 0.45, duration: 0.6, ease: 'power2.in' }, 0)
          .to(seal.material, { opacity: 0, duration: 0.4 }, 0.25)

          // Flap rotates back. -179deg (not full -180) so the flap
          // never disappears flat from view; small offset preserves
          // some lighting on its back face.
          .to(flapPivot.rotation, {
            x: -Math.PI * 0.985,
            duration: 1.45,
            ease: 'power3.inOut',
          }, 0.3)

          // Subtle camera push-in as the seal cracks. Communicates
          // attention/intimacy. Hand-tuned values, not maths.
          .to(camera.position, {
            z: 6.6,
            y: 0.65,
            duration: 1.7,
            ease: 'power2.inOut',
          }, 0.1);
      } else {
        // Minimal fallback if GSAP isn't loaded. Linear, no easing.
        const start = performance.now();
        const dur = 1700;
        function step(now) {
          const t = Math.min(1, (now - start) / dur);
          seal.scale.setScalar(Math.max(0.6, 1 - t * 0.4));
          seal.material.opacity = Math.max(0, 1 - t * 1.2);
          flapPivot.rotation.x = -Math.PI * 0.985 * t;
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }
    }

    // -----------------------------------------------------------------
    // 9. Render loop. Always running so HDRi reflections (Phase 2)
    //    update smoothly even when nothing is animating.
    // -----------------------------------------------------------------
    function tick() {
      requestAnimationFrame(tick);
      renderer.render(scene, camera);
    }
    tick();

    // -----------------------------------------------------------------
    // 10. IntersectionObserver triggers the open animation when the
    //     envelope section enters the viewport. The same observer
    //     adds the .is-revealed class that the existing CSS uses to
    //     animate the letter section below.
    // -----------------------------------------------------------------
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.classList.add('is-revealed');
            openEnvelope();
            observer.unobserve(section);
          }
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });
      observer.observe(section);
    } else {
      section.classList.add('is-revealed');
      openEnvelope();
    }

    // -----------------------------------------------------------------
    // 11. Resize. Keep the canvas in lockstep with its container
    //     dimensions so the envelope never warps on viewport changes.
    // -----------------------------------------------------------------
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        stageWidth = stage.clientWidth || 460;
        stageHeight = stage.clientHeight || 300;
        renderer.setSize(stageWidth, stageHeight, false);
        camera.aspect = stageWidth / stageHeight;
        camera.updateProjectionMatrix();
      }, 100);
    });
  }
})();
