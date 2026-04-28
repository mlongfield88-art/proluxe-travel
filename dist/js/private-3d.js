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
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

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
    // 5. Environment lighting via HDRi. Soft studio hdr from
    //    polyhaven.com lit our envelope from a 360-degree dome of
    //    real-world light sources. Eliminates the "computer-graphics
    //    plastic" look of fake directional lights. PMREMGenerator
    //    converts the equirectangular hdr into a cubemap environment
    //    that PBR materials can sample for reflections.
    // -----------------------------------------------------------------
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader().load('/img/hdri/studio.hdr', (hdrTexture) => {
      const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
      scene.environment = envMap;
      hdrTexture.dispose();
      pmremGenerator.dispose();
    });

    // Subtle key light from above-right for shadow definition. The
    // HDRi handles ambient and reflections, this just gives the
    // shadow some shape on the desk surface (envelope onto itself).
    const key = new THREE.DirectionalLight(0xfff2dc, 0.9);
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

    // -----------------------------------------------------------------
    // 6. Texture loading. Cardboard maps from ambientCG.com applied
    //    to the cardstock as normal + roughness only. The base colour
    //    stays olive, the texture only adds surface detail (paper
    //    grain, fibre direction, slight roughness variation). This
    //    is how real PBR pipelines tint cardstock without losing the
    //    brand colour.
    // -----------------------------------------------------------------
    const texLoader = new THREE.TextureLoader();
    function loadTex(path, sRGB) {
      const t = texLoader.load(path);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1.4, 1.0);
      if (sRGB) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }
    const paperColor = loadTex('/img/textures/paper/color.jpg', true);
    const paperNormal = loadTex('/img/textures/paper/normal.jpg', false);
    const paperRoughness = loadTex('/img/textures/paper/roughness.jpg', false);

    // Wax surface maps. Stand-in is a plaster texture from ambientCG
    // because pure-wax PBR sets are rare. Plaster gives the same
    // matte-with-tiny-imperfections surface that thick wax cools to.
    function loadWaxTex(path, sRGB) {
      const t = texLoader.load(path);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 2);
      if (sRGB) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }
    const waxNormal = loadWaxTex('/img/textures/wax/wax-normal.jpg', false);
    const waxRoughness = loadWaxTex('/img/textures/wax/wax-roughness.jpg', false);

    // -----------------------------------------------------------------
    // 7. Materials. Olive cardstock outside, cream cardstock inside,
    //    burgundy wax. MeshPhysicalMaterial gives us clearcoat for
    //    the wax (subtle wet sheen) and proper sheen on the paper.
    //    Normal + roughness maps add tactile detail. Base colour is
    //    set via .color to preserve brand olive, since the texture
    //    is brown cardboard.
    // -----------------------------------------------------------------
    const COLOURS = {
      olive: 0x424632,
      cream: 0xece4d2,
      wax: 0x8a1f24,
    };

    const cardstockBack = new THREE.MeshPhysicalMaterial({
      color: COLOURS.olive,
      roughness: 0.92,
      roughnessMap: paperRoughness,
      normalMap: paperNormal,
      normalScale: new THREE.Vector2(0.4, 0.4),
      metalness: 0.0,
      sheen: 0.15,
      sheenColor: 0x4d513c,
    });

    const flapOuterMat = new THREE.MeshPhysicalMaterial({
      color: COLOURS.olive,
      roughness: 0.92,
      roughnessMap: paperRoughness,
      normalMap: paperNormal,
      normalScale: new THREE.Vector2(0.4, 0.4),
      metalness: 0.0,
      sheen: 0.15,
      sheenColor: 0x4d513c,
      side: THREE.FrontSide,
    });

    const flapInnerMat = new THREE.MeshPhysicalMaterial({
      color: COLOURS.cream,
      roughness: 0.94,
      roughnessMap: paperRoughness,
      normalMap: paperNormal,
      normalScale: new THREE.Vector2(0.3, 0.3),
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    // Wax: thicker clearcoat with rougher coat surface mimics the way
    // thick sealing wax has a slightly cloudy outer skin over a darker
    // core. Plaster normal+roughness maps add the natural imperfection
    // of cooled wax (small bumps, valleys, uneven sheen). Sheen layer
    // adds the characteristic colour shift wax has at grazing angles.
    // Note: full subsurface scattering (transmission + thickness) is
    // possible here but tanks performance on integrated GPUs, so we
    // fake it with a slight emissive tint on the inner colour.
    const waxMat = new THREE.MeshPhysicalMaterial({
      color: COLOURS.wax,
      roughness: 0.55,
      roughnessMap: waxRoughness,
      normalMap: waxNormal,
      normalScale: new THREE.Vector2(0.7, 0.7),
      metalness: 0.0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.45,
      sheen: 0.4,
      sheenColor: 0xff5060,
      sheenRoughness: 0.6,
      transparent: true,
      opacity: 1,
    });

    // -----------------------------------------------------------------
    // 8. Envelope geometry. ExtrudeGeometry from 2D shapes gives us
    //    real paper thickness with beveled edges, vs. a flat
    //    BoxGeometry which always reads as a slab. The bevel is
    //    where light catches first, so it does most of the work
    //    selling "this is a paper object" to the eye.
    //
    //    Group hierarchy:
    //      envelope
    //        body          (rounded rectangle, extruded)
    //        letter        (paper plane, hidden inside body)
    //        seal          (irregular disc, extruded)
    //        flapPivot     (rotates around top edge)
    //          flapOuter   (triangle, extruded)
    //          flapInner   (triangle, extruded, cream)
    // -----------------------------------------------------------------

    // Envelope body: rounded rectangle with rounded corners and a
    // beveled extrude for paper thickness. Corners use
    // quadraticCurveTo for smooth arcs. The bevel produces a soft
    // edge that catches highlights — the single biggest "this is
    // paper" tell vs. a sharp box.
    function makeBodyShape() {
      const w = 4.6, h = 3.0, r = 0.08;
      const s = new THREE.Shape();
      s.moveTo(-w/2 + r, -h/2);
      s.lineTo(w/2 - r, -h/2);
      s.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
      s.lineTo(w/2, h/2 - r);
      s.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
      s.lineTo(-w/2 + r, h/2);
      s.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
      s.lineTo(-w/2, -h/2 + r);
      s.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
      return s;
    }

    const envelope = new THREE.Group();

    const bodyGeo = new THREE.ExtrudeGeometry(makeBodyShape(), {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 6,
      curveSegments: 16,
    });
    bodyGeo.center();
    const body = new THREE.Mesh(bodyGeo, cardstockBack);
    body.castShadow = true;
    body.receiveShadow = true;
    envelope.add(body);

    // Inner letter: cream paper plane sitting just inside the
    // envelope body, will slide out during the animation.
    const letterGeo = new THREE.PlaneGeometry(4.3, 2.7, 1, 1);
    const letterMat = new THREE.MeshPhysicalMaterial({
      color: 0xfaf6ec,
      roughness: 0.94,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const letterPaper = new THREE.Mesh(letterGeo, letterMat);
    letterPaper.position.set(0, 0, 0.001);
    letterPaper.castShadow = true;
    letterPaper.receiveShadow = true;
    envelope.add(letterPaper);

    // Flap shape: triangle with a slightly rounded V tip, extruded
    // for thickness. Origin at top-edge midpoint so rotation pivots
    // around the fold line.
    function makeFlapShape() {
      const s = new THREE.Shape();
      s.moveTo(-2.3, 0);
      s.lineTo(2.3, 0);
      s.lineTo(0.06, -1.92);
      s.quadraticCurveTo(0, -1.96, -0.06, -1.92);
      s.lineTo(-2.3, 0);
      return s;
    }
    function makeFlapGeometry() {
      const g = new THREE.ExtrudeGeometry(makeFlapShape(), {
        depth: 0.014,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.005,
        bevelSegments: 3,
        curveSegments: 8,
      });
      return g;
    }

    const flapPivot = new THREE.Group();
    flapPivot.position.set(0, 1.5, 0.025);

    const flapOuter = new THREE.Mesh(makeFlapGeometry(), flapOuterMat);
    flapOuter.castShadow = true;
    flapPivot.add(flapOuter);

    // Inner face: same flap, flipped to face the other way and
    // offset back slightly. The cream interior shows when the flap
    // rotates open. Flipping via rotateY(PI) and pushing in z so
    // the back face becomes the front-facing surface.
    const flapInner = new THREE.Mesh(makeFlapGeometry(), flapInnerMat);
    flapInner.rotation.y = Math.PI;
    flapInner.position.z = -0.001;
    flapPivot.add(flapInner);

    envelope.add(flapPivot);

    // Wax seal: irregular extruded disc. The 16-vertex hand-tuned
    // path mimics melted wax bleed, vs. a perfect cylinder which
    // reads as a hockey puck. Bevel softens the top edge so the
    // light catches it like a wet wax dome.
    function makeSealShape() {
      const s = new THREE.Shape();
      const pts = [
        [0.42, 0.00], [0.40, 0.18], [0.34, 0.30], [0.24, 0.36],
        [0.10, 0.40], [-0.08, 0.39], [-0.22, 0.34], [-0.32, 0.26],
        [-0.39, 0.14], [-0.41, -0.02], [-0.38, -0.16], [-0.30, -0.27],
        [-0.18, -0.36], [-0.04, -0.40], [0.14, -0.38], [0.28, -0.30],
        [0.36, -0.18], [0.41, -0.04],
      ];
      s.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
      s.lineTo(pts[0][0], pts[0][1]);
      return s;
    }

    // Wax seal geometry: thin base + big rounded bevel = dome shape,
    // not a hockey puck. bevelThickness > bevelSize makes the front
    // bulge out further than its inset, mimicking a wax blob that
    // cooled in a slight mound. 14 bevel segments + 8 curve segments
    // give a smooth top, then we displace those vertices slightly so
    // it doesn't read as machined-perfect.
    const sealGeo = new THREE.ExtrudeGeometry(makeSealShape(), {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.075,
      bevelSize: 0.04,
      bevelSegments: 14,
      curveSegments: 8,
    });
    sealGeo.center();

    // Vertex noise: jitter front-face positions slightly so the dome
    // surface has organic micro-imperfections rather than reading as
    // a perfect mathematical curve. Only the front (positive z) face
    // is displaced; the back (sat against the envelope body) stays
    // flat. Uses pseudo-random hash, not Three's noise utility, to
    // keep this scene zero-extra-imports.
    const sealPos = sealGeo.getAttribute('position');
    function hash3(x, y, z) {
      const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
      return s - Math.floor(s);
    }
    for (let i = 0; i < sealPos.count; i++) {
      const x = sealPos.getX(i);
      const y = sealPos.getY(i);
      const z = sealPos.getZ(i);
      // Only displace front-facing vertices (z above mid-plane).
      if (z > 0.02) {
        const n = (hash3(x, y, z) - 0.5) * 0.012;
        sealPos.setZ(i, z + n);
      }
    }
    sealGeo.computeVertexNormals();

    const seal = new THREE.Mesh(sealGeo, waxMat);
    // Sit the seal proud of the envelope front, dome facing camera.
    seal.position.set(0, 0, 0.06);
    seal.castShadow = true;
    seal.receiveShadow = true;
    envelope.add(seal);

    // Slight upward tilt on the whole envelope so the lighting
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

        // Seal cracks: scale, drop, rotate, fade.
        tl.to(seal.scale, { x: 0.55, y: 0.55, z: 0.55, duration: 0.5, ease: 'power2.in' }, 0)
          .to(seal.position, { z: 0.45, y: -0.32, duration: 0.55, ease: 'power2.in' }, 0)
          .to(seal.rotation, { z: 0.45, x: 0.2, duration: 0.6, ease: 'power2.in' }, 0)
          .to(seal.material, { opacity: 0, duration: 0.4 }, 0.25)

          // Flap rotates back. -177deg so the flap never disappears
          // flat from view, preserving some lighting on its inner face.
          .to(flapPivot.rotation, {
            x: -Math.PI * 0.985,
            duration: 1.45,
            ease: 'power3.inOut',
          }, 0.3)

          // Letter slides up and out of the envelope. Starts inside
          // the body, ends visible above the open envelope. Subtle
          // forward-z so it sits proud of the body, not flush.
          .to(letterPaper.position, {
            y: 1.6,
            z: 0.18,
            duration: 1.3,
            ease: 'power2.out',
          }, 0.95)

          // Subtle camera push-in as the seal cracks. Communicates
          // attention/intimacy without screaming "cinematic".
          .to(camera.position, {
            z: 6.4,
            y: 0.7,
            duration: 1.9,
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
