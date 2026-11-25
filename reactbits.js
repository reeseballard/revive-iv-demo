/*
  React Bits effects, ported to plain JavaScript for this site:
  Aurora, Spotlight Card, Star Border and Click Spark.
  (Gradient Text and Shiny Text are pure CSS, in styles.css.)

  Based on React Bits by David Haz: https://reactbits.dev  https://github.com/DavidHDev/react-bits
  ---------------------------------------------------------------------------
  MIT + Commons Clause License Condition v1.0
  Copyright (c) 2026 David Haz
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, and distribute the Software as part of an
  application, website, or product, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  Commons Clause Restriction: You may use this Software, including for any commercial
  purpose, so long as you do not sell, sublicense, or redistribute the components
  themselves, whether alone, in a bundle, or as a ported version.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
  ---------------------------------------------------------------------------
*/
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* =========================================================================
     AURORA (WebGL2 background), behind the hero
     ========================================================================= */
  function initAurora(container, opts) {
    var MAX_STOPS = 5, MAX_LAYERS = 3, INTRO_SECONDS = 2.4;
    var VERTEX = '#version 300 es\nin vec2 aPosition;\nvoid main() { gl_Position = vec4(aPosition, 0.0, 1.0); }';
    var FRAGMENT = '#version 300 es\n' +
      'precision highp float;\nprecision highp int;\n' +
      'uniform vec2 uResolution;\nuniform float uTime;\nuniform vec3 uStops[' + MAX_STOPS + '];\nuniform int uStopCount;\n' +
      'uniform float uAmplitude;\nuniform float uBlend;\nuniform float uHeight;\nuniform float uScale;\nuniform float uGlow;\n' +
      'uniform float uBrightness;\nuniform int uLayers;\nuniform float uFlip;\nuniform vec3 uPointer;\nuniform float uReveal;\n' +
      'uniform float uOpacity;\nuniform float uLightMode;\nout vec4 outColor;\n' +
      'vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }\n' +
      'float snoise(vec2 v) {\n' +
      '  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);\n' +
      '  vec2 i = floor(v + dot(v, C.yy));\n  vec2 x0 = v - i + dot(i, C.xx);\n' +
      '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n  vec4 x12 = x0.xyxy + C.xxzz;\n  x12.xy -= i1;\n' +
      '  i = mod(i, 289.0);\n  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\n' +
      '  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);\n  m = m * m;\n  m = m * m;\n' +
      '  vec3 x = 2.0 * fract(p * C.www) - 1.0;\n  vec3 h = abs(x) - 0.5;\n  vec3 ox = floor(x + 0.5);\n  vec3 a0 = x - ox;\n' +
      '  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);\n  vec3 g;\n  g.x = a0.x * x0.x + h.x * x0.y;\n' +
      '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n  return 130.0 * dot(m, g);\n}\n' +
      'float smootherstep(float e0, float e1, float x) { float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0); return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }\n' +
      'vec3 oklabToLinear(vec3 c) {\n' +
      '  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;\n  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;\n' +
      '  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;\n  l = l * l * l; m = m * m * m; s = s * s * s;\n' +
      '  return vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);\n}\n' +
      'vec3 toSrgb(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }\n' +
      'vec3 ramp(float t) {\n  float x = clamp(t, 0.0, 1.0) * float(uStopCount - 1);\n  int i = int(min(floor(x), float(uStopCount - 2)));\n' +
      '  float f = x - float(i);\n  f = f * f * (3.0 - 2.0 * f);\n  vec3 lch = mix(uStops[i], uStops[i + 1], f);\n' +
      '  lch.x = mix(lch.x, min(lch.x, 0.7), uLightMode);\n  return toSrgb(oklabToLinear(vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z))));\n}\n' +
      'float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\n' +
      'void main() {\n  vec2 frag = gl_FragCoord.xy;\n  float y = 1.0 - frag.y / uResolution.y;\n  y = mix(y, 1.0 - y, uFlip);\n' +
      '  float u = frag.x / uResolution.x;\n  float X = (frag.x - uResolution.x * 0.5) / uResolution.y;\n  float t = uTime;\n' +
      '  float reach = uPointer.z * exp(-pow((X - uPointer.x) / 0.38, 2.0));\n  vec3 glow = vec3(0.0);\n  float cover = 0.0;\n' +
      '  for (int k = 0; k < ' + MAX_LAYERS + '; k++) {\n    if (k >= uLayers) break;\n    float layer = float(k);\n    float seed = layer * 13.7;\n' +
      '    float pace = t * (1.0 - layer * 0.18);\n    float warp = snoise(vec2(X * 0.45 * uScale + pace * 0.02 + seed, pace * 0.05 + seed));\n' +
      '    float wave = snoise(vec2(X * 0.75 * uScale + warp * 0.35 - pace * 0.03 + seed, pace * 0.07 - seed)) * 0.72\n' +
      '      + snoise(vec2(X * 1.6 * uScale + warp * 0.5 + pace * 0.04 - seed, pace * 0.1 + seed * 0.5)) * 0.28;\n' +
      '    float hem = uHeight + layer * 0.07 + wave * 0.15 * uAmplitude;\n    hem += reach * 0.08 * (layer < 0.5 ? 1.0 : 0.4);\n' +
      '    hem = mix(-0.25, hem, uReveal);\n    float soft = (0.04 + uBlend * 0.16) * (1.0 + layer * 0.9);\n    float rise = hem - y;\n' +
      '    float low = -soft - uGlow * 0.14;\n    float high = 0.26 + soft * 0.6;\n    float body = pow(smootherstep(low, high, rise), 1.5 + uGlow * 0.6);\n' +
      '    float lobes = 0.86 + 0.14 * snoise(vec2(X * 0.9 * uScale - pace * 0.025 + seed, y * 0.3 + pace * 0.04));\n' +
      '    float alpha = body * lobes * (layer < 0.5 ? 1.0 : 0.32 / layer);\n' +
      '    alpha = clamp(alpha * (1.0 + reach * 0.25 * smootherstep(0.9, 0.0, abs(y - hem))), 0.0, 1.0);\n' +
      '    vec3 tint = ramp(u + 0.05 * sin(pace * 0.08 + layer * 2.3) + layer * 0.1 + max(rise, 0.0) * 0.05);\n' +
      '    glow = 1.0 - (1.0 - glow) * (1.0 - tint * alpha);\n    cover = 1.0 - (1.0 - cover) * (1.0 - alpha);\n  }\n' +
      '  float fade = smootherstep(0.0, 0.7, uReveal) * uOpacity;\n  float strength = clamp(uBrightness, 0.0, 2.0);\n' +
      '  glow *= fade * min(strength, 1.0);\n  cover *= fade * min(strength, 1.0);\n  glow = 1.0 - pow(1.0 - glow, vec3(max(strength, 1.0)));\n' +
      '  float dither = (hash(frag) - 0.5) / 255.0;\n  if (uLightMode > 0.5) {\n    vec3 tint = cover > 0.0001 ? glow / cover : vec3(0.0);\n' +
      '    cover *= smootherstep(0.0, 0.25, cover);\n    float alpha = cover * 0.7;\n' +
      '    outColor = vec4(tint * alpha + dither, clamp(alpha + dither, 0.0, 1.0));\n    return;\n  }\n' +
      '  outColor = vec4(glow + dither, clamp(cover + dither, 0.0, 1.0));\n}';

    var s = {
      stops: opts.colorStops, amplitude: opts.amplitude || 1, blend: opts.blend == null ? 0.5 : opts.blend,
      speed: opts.speed || 1, height: opts.height == null ? 0.45 : opts.height, scale: opts.scale || 1,
      glow: opts.glow == null ? 0.6 : opts.glow, brightness: opts.brightness || 1, layers: opts.layers || 1,
      flip: opts.direction === 'bottom' ? 1 : 0, mouseInteraction: opts.mouseInteraction !== false,
      intro: opts.intro !== false, opacity: opts.opacity == null ? 1 : opts.opacity, lightMode: !!opts.lightMode
    };

    var canvas = document.createElement('canvas');
    canvas.className = 'aurora-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    var gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) { canvas.remove(); return false; }

    function compile(type, src) {
      var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
      if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
      gl.deleteShader(sh); return null;
    }
    var vs = compile(gl.VERTEX_SHADER, VERTEX), fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    var program = gl.createProgram();
    if (!vs || !fs) { canvas.remove(); return false; }
    gl.attachShader(program, vs); gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPosition'); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.remove(); return false; }
    var u = {};
    var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var info = gl.getActiveUniform(program, i);
      u[info.name.replace('[0]', '')] = gl.getUniformLocation(program, info.name);
    }
    var buffer = gl.createBuffer(), vao = gl.createVertexArray();
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Colors -> OKLCH palette (once; stops don't change)
    var probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    function parse(v) {
      probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#ffffff'; probe.fillStyle = v; probe.fillRect(0, 0, 1, 1);
      var d = probe.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255];
    }
    function toOklch(rgb) {
      var c = rgb.map(function (x) { return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
      var l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]);
      var m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]);
      var q = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
      var lab = [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q];
      return [lab[0], Math.hypot(lab[1], lab[2]), Math.atan2(lab[2], lab[1])];
    }
    var stops = s.stops.slice(0, MAX_STOPS).map(function (c) { return toOklch(parse(c)); });
    var prevHue = (stops.find(function (st) { return st[1] > 0.02; }) || [0, 0, 0])[2];
    stops = stops.map(function (st) {
      var hue = st[1] > 0.02 ? st[2] : prevHue;
      while (hue - prevHue > Math.PI) hue -= Math.PI * 2;
      while (hue - prevHue < -Math.PI) hue += Math.PI * 2;
      prevHue = hue; return [st[0], st[1], hue];
    });
    var palette = new Float32Array(MAX_STOPS * 3);
    stops.forEach(function (st, idx) { palette.set(st, idx * 3); });

    var view = { width: 1, height: 1 }, pointer = { x: 0, y: 0, inside: false };
    var state = { clock: 0, px: 0, py: 0.5, reach: 0, reveal: s.intro && !reduce ? 0 : 1 };
    var raf = 0, last = 0, visible = true;

    function render() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program); gl.bindVertexArray(vao);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, state.clock);
      gl.uniform3fv(u.uStops, palette);
      gl.uniform1i(u.uStopCount, stops.length);
      gl.uniform1f(u.uAmplitude, s.amplitude); gl.uniform1f(u.uBlend, s.blend);
      gl.uniform1f(u.uHeight, s.height); gl.uniform1f(u.uScale, s.scale);
      gl.uniform1f(u.uGlow, s.glow); gl.uniform1f(u.uBrightness, s.brightness);
      gl.uniform1i(u.uLayers, s.layers); gl.uniform1f(u.uFlip, s.flip);
      gl.uniform3f(u.uPointer, state.px, state.py, state.reach);
      gl.uniform1f(u.uReveal, 1 - Math.pow(1 - state.reveal, 3));
      gl.uniform1f(u.uOpacity, s.opacity); gl.uniform1f(u.uLightMode, s.lightMode ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      var dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;
      state.clock += dt * s.speed * (reduce ? 0 : 1);
      var engaged = s.mouseInteraction && pointer.inside && !reduce;
      var follow = 1 - Math.exp(-dt / 0.6);
      if (engaged) {
        var tx = (pointer.x - view.width / 2) / view.height;
        var ty = s.flip ? 1 - pointer.y / view.height : pointer.y / view.height;
        state.px += (tx - state.px) * follow; state.py += (ty - state.py) * follow;
      }
      state.reach += ((engaged ? 1 : 0) - state.reach) * (1 - Math.exp(-dt / (engaged ? 0.9 : 1.4)));
      if (!s.intro || reduce) state.reveal = 1;
      else if (state.reveal < 1) state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);
      render();
      if (!reduce || state.reveal < 1) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
    function resize() {
      var w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
      var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      view.width = w; view.height = h;
      canvas.width = Math.max(1, Math.round(w * ratio)); canvas.height = Math.max(1, Math.round(h * ratio));
      render(); wake();
    }
    window.addEventListener('pointermove', function (e) {
      var r = container.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= r.height;
      wake();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { pointer.inside = false; });
    document.addEventListener('visibilitychange', function () { last = 0; wake(); });
    new ResizeObserver(resize).observe(container);
    new IntersectionObserver(function (entries) {
      visible = entries.some(function (en) { return en.isIntersecting; });
      if (visible) { last = 0; wake(); }
    }).observe(container);
    resize();
    return true;
  }

  /* =========================================================================
     SPOTLIGHT CARD: a soft glow that follows the pointer
     ========================================================================= */
  function falloff(color, softness) {
    var soft = clamp(softness, 0, 1), core = Math.pow(1 - soft, 1.5) * 0.85;
    var stop = function (a, at) { return 'color-mix(in srgb, ' + color + ' ' + (a * 100).toFixed(2) + '%, transparent) ' + (at * 100).toFixed(2) + '%'; };
    var list = [stop(1, 0)];
    for (var i = 0; i <= 14; i++) {
      var t = core + ((1 - core) * i) / 14, g = (t - core) / (1 - core);
      var smooth = 1 - g * g * (3 - 2 * g), glow = Math.exp(-4.6 * g * g) * (1 - Math.pow(g, 6));
      list.push(stop(smooth + (glow - smooth) * soft, t));
    }
    return list.join(', ');
  }
  function initSpotlight(root, opts) {
    var color = opts.color, size = opts.size || 240, intensity = opts.intensity, borderGlow = opts.borderGlow;
    var proximity = opts.proximity == null ? 80 : opts.proximity, smoothing = 0.3;
    var fillStops = falloff(color, 0.7), edgeStops = falloff(color, 1);
    root.classList.add('spotlight-card');
    var light = document.createElement('span'); light.className = 'spotlight-card__light'; light.setAttribute('aria-hidden', 'true');
    var edge = document.createElement('span'); edge.className = 'spotlight-card__edge'; edge.setAttribute('aria-hidden', 'true');
    root.prepend(light); root.appendChild(edge);

    var state = { x: 0, y: 0, presence: 0 }, pointer = { x: 0, y: 0, active: false };
    var raf = 0, last = 0;
    function grad(sz, x, y, st) { return 'radial-gradient(circle ' + sz.toFixed(1) + 'px at ' + x.toFixed(1) + 'px ' + y.toFixed(1) + 'px, ' + st + ')'; }
    function tick(now) {
      raf = 0;
      var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
      var rect = root.getBoundingClientRect(), tx = state.x, ty = state.y, target = 0;
      if (pointer.active) {
        tx = pointer.x - rect.left; ty = pointer.y - rect.top;
        var gap = Math.hypot(Math.max(0, -tx, tx - rect.width), Math.max(0, -ty, ty - rect.height));
        target = gap === 0 ? 1 : Math.pow(Math.max(0, 1 - gap / proximity), 2);
      }
      if (state.presence < 0.02 && target > 0) { state.x = tx; state.y = ty; }
      var follow = reduce ? 1 : 1 - Math.exp(-dt / (0.015 + smoothing * 0.22));
      state.x += (tx - state.x) * follow; state.y += (ty - state.y) * follow;
      var fade = reduce ? 1 : 1 - Math.exp(-dt / (target > state.presence ? 0.1 : 0.32));
      state.presence += (target - state.presence) * fade;
      if (Math.abs(target - state.presence) < 0.002) state.presence = target;
      light.style.background = grad(size, state.x, state.y, fillStops);
      edge.style.background = grad(size * 0.6, state.x, state.y, edgeStops);
      light.style.opacity = String(Math.min(1, state.presence * intensity));
      edge.style.opacity = String(Math.min(1, state.presence * borderGlow));
      var moving = Math.abs(tx - state.x) > 0.1 || Math.abs(ty - state.y) > 0.1;
      if (moving || state.presence !== target) raf = requestAnimationFrame(tick);
    }
    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; wake();
    }, { passive: true });
    document.addEventListener('pointerout', function (e) { if (!e.relatedTarget) { pointer.active = false; wake(); } });
    window.addEventListener('scroll', function () { if (pointer.active || state.presence > 0) wake(); }, { passive: true, capture: true });
  }

  /* =========================================================================
     STAR BORDER: a light that travels around an element's edge
     ========================================================================= */
  function initStarBorder(root, opts) {
    var BLEED = 48, LAP = 0.9, TAU = Math.PI * 2;
    var s = {
      duration: opts.duration || 5, thickness: opts.thickness || 2, radius: opts.radius || 24,
      trailLength: opts.trailLength == null ? 0.35 : opts.trailLength, stars: opts.stars || 2, glow: opts.glow == null ? 0.7 : opts.glow
    };
    var head = hexToRgb(opts.color), tail = hexToRgb(opts.trailColor || opts.color);
    var canvas = document.createElement('canvas');
    canvas.className = 'star-border__light'; canvas.setAttribute('aria-hidden', 'true');
    root.classList.add('star-border-host'); root.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var st = { width: 0, height: 0, dpr: 1, phase: 0, velocity: 0, motion: 0, lap: -1, flash: 0, visible: true };
    var pulses = [], point = { x: 0, y: 0 }, raf = 0, last = performance.now();

    function hexToRgb(h) { var n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function rgba(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
    function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function wrap(v, t) { return ((v % t) + t) % t; }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2; }
    function outline(w, h, rad) {
      var r = Math.max(0, Math.min(rad, w / 2, h / 2)), arc = Math.PI * r / 2, across = Math.max(0, w - 2 * r), down = Math.max(0, h - 2 * r);
      var segs = [
        { length: across, x: r, y: 0, dx: 1, dy: 0, angle: null }, { length: arc, x: w - r, y: r, angle: -Math.PI / 2 },
        { length: down, x: w, y: r, dx: 0, dy: 1, angle: null }, { length: arc, x: w - r, y: h - r, angle: 0 },
        { length: across, x: w - r, y: h, dx: -1, dy: 0, angle: null }, { length: arc, x: r, y: h - r, angle: Math.PI / 2 },
        { length: down, x: 0, y: h - r, dx: 0, dy: -1, angle: null }, { length: arc, x: r, y: r, angle: Math.PI }
      ];
      return { r: r, segments: segs, total: Math.max(1, segs.reduce(function (a, g) { return a + g.length; }, 0)) };
    }
    function pointAt(shape, d) {
      var rem = wrap(d, shape.total);
      for (var i = 0; i < shape.segments.length; i++) {
        var g = shape.segments[i];
        if (g.length > 0 && rem <= g.length) {
          if (g.angle === null) { point.x = g.x + g.dx * rem; point.y = g.y + g.dy * rem; }
          else { var a = g.angle + rem / shape.r; point.x = g.x + Math.cos(a) * shape.r; point.y = g.y + Math.sin(a) * shape.r; }
          return point;
        }
        rem -= g.length;
      }
      return point;
    }
    function line(x1, y1, x2, y2, w, style) { ctx.lineWidth = w; ctx.strokeStyle = style; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
    function trail(shape, h, len, sign, inten) {
      if (len < 0.5 || inten <= 0) return;
      var steps = clamp(Math.ceil(len / 2), 2, 90);
      pointAt(shape, h); var px = point.x, py = point.y;
      for (var i = 1; i <= steps; i++) {
        pointAt(shape, h - sign * len * (i / steps));
        var uu = 1 - (i - 0.5) / steps, fade = uu * uu * inten, tone = mixc(tail, head, uu);
        ctx.lineCap = i === 1 ? 'round' : 'butt';
        line(px, py, point.x, point.y, 2 + 6 * s.glow, rgba(tone, fade * 0.18 * s.glow));
        line(px, py, point.x, point.y, s.thickness, rgba(tone, fade));
        px = point.x; py = point.y;
      }
    }
    function bloom(x, y, inten) {
      var reach = 12 + 40 * s.glow, g = ctx.createRadialGradient(x, y, 0, x, y, reach), k = 0.35 * s.glow * inten;
      g.addColorStop(0, rgba(head, k)); g.addColorStop(0.2, rgba(head, k * 0.4)); g.addColorStop(0.5, rgba(head, k * 0.1)); g.addColorStop(1, rgba(head, 0));
      ctx.fillStyle = g; ctx.fillRect(x - reach, y - reach, reach * 2, reach * 2);
    }
    function measure() {
      st.width = root.offsetWidth; st.height = root.offsetHeight; st.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round((st.width + BLEED * 2) * st.dpr));
      canvas.height = Math.max(1, Math.round((st.height + BLEED * 2) * st.dpr));
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
      var shape = outline(Math.max(1, st.width - s.thickness), Math.max(1, st.height - s.thickness), s.radius - s.thickness / 2);
      var total = shape.total, spacing = total / s.stars, cruise = reduce ? 0 : total / s.duration;
      st.velocity += (cruise - st.velocity) * (1 - Math.exp(-dt / 0.45));
      var extra = 0;
      if (st.lap >= 0) {
        var before = ease(Math.min(1, st.lap / LAP)); st.lap += dt;
        extra = (ease(Math.min(1, st.lap / LAP)) - before) * total;
        if (st.lap >= LAP) st.lap = -1;
      }
      st.motion = st.velocity + extra / dt;
      st.phase = wrap(st.phase + st.velocity * dt + extra, total);
      st.flash *= Math.exp(-dt / 0.22);
      for (var p = pulses.length - 1; p >= 0; p--) { pulses[p].age += dt; if (pulses[p].age >= 0.65) pulses.splice(p, 1); }

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      var off = (BLEED + s.thickness / 2) * st.dpr;
      ctx.setTransform(st.dpr, 0, 0, st.dpr, off, off);
      ctx.globalCompositeOperation = 'source-over';
      var len = Math.min(Math.abs(st.motion) * s.trailLength * s.duration, spacing * 0.92, total * 0.6);
      var inten = 1 + 0.6 * st.flash;
      if (reduce) len = 60;
      for (var i = 0; i < s.stars; i++) trail(shape, st.phase + i * spacing, len, 1, Math.min(1, inten));
      pulses.forEach(function (pl) {
        var fade = Math.pow(1 - pl.age / 0.65, 2), travel = (total / 2) * (1 - Math.pow(1 - Math.min(1, pl.age / 0.5), 2));
        [1, -1].forEach(function (way) {
          var front = pl.origin + way * travel;
          trail(shape, front, Math.min(travel, total * 0.16), way, fade);
          pointAt(shape, front); bloom(point.x, point.y, fade * 0.8);
        });
      });
      for (var j = 0; j < s.stars; j++) { pointAt(shape, st.phase + j * spacing); bloom(point.x, point.y, Math.min(1.3, inten)); }
      if (st.visible && (!reduce || pulses.length)) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && st.visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    root.addEventListener('pointerenter', function () { if (st.lap < 0 && !reduce) st.lap = 0; wake(); });
    root.addEventListener('pointerdown', function () { pulses.push({ origin: st.phase, age: 0 }); if (pulses.length > 4) pulses.shift(); st.flash = 1; wake(); });
    new ResizeObserver(function () { measure(); wake(); }).observe(root);
    new IntersectionObserver(function (en) { st.visible = en.some(function (x) { return x.isIntersecting; }); if (st.visible) wake(); }).observe(root);
    measure(); wake();
  }

  /* =========================================================================
     CLICK SPARK: little lines burst out wherever you click
     ========================================================================= */
  function initClickSpark(opts) {
    if (reduce) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'click-spark'; canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d'), sparks = [], raf = 0, dpr = 1;
    var color = opts.color, size = opts.size || 12, radius = opts.radius || 22, count = opts.count || 8, duration = opts.duration || 420;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    }
    function easeOut(t) { return t * (2 - t); }
    function draw(now) {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
      sparks = sparks.filter(function (sp) {
        var t = (now - sp.start) / duration;
        if (t >= 1) return false;
        var e = easeOut(t), dist = e * radius, len = size * (1 - e);
        var x1 = sp.x + dist * Math.cos(sp.angle), y1 = sp.y + dist * Math.sin(sp.angle);
        var x2 = sp.x + (dist + len) * Math.cos(sp.angle), y2 = sp.y + (dist + len) * Math.sin(sp.angle);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        return true;
      });
      if (sparks.length) raf = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize); resize();
    document.addEventListener('pointerdown', function (e) {
      var now = performance.now();
      for (var i = 0; i < count; i++) sparks.push({ x: e.clientX, y: e.clientY, angle: (2 * Math.PI * i) / count, start: now });
      if (!raf) raf = requestAnimationFrame(draw);
    });
  }

  /* =========================================================================
     Wire everything up with the site's brand colors
     ========================================================================= */
  var hero = document.querySelector('.hero');
  var auroraHost = document.querySelector('.hero-aurora');
  if (auroraHost && initAurora(auroraHost, {
    colorStops: ['#2A9D8F', '#5CC2B5', '#1F7A6F', '#2A9D8F'],
    amplitude: 1.3, blend: 0.55, height: 0.5, speed: 1, layers: 3, glow: 0.7, brightness: 1, opacity: 0.85, lightMode: true
  })) {
    hero.classList.add('has-aurora');
  }

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    document.querySelectorAll('.card, .feature').forEach(function (el) {
      initSpotlight(el, { color: '#2A9D8F', size: 260, intensity: 0.22, borderGlow: 0.7 });
    });
  }

  var featured = document.querySelector('.card-featured');
  if (featured) initStarBorder(featured, { color: '#1F7A6F', trailColor: '#5CC2B5', radius: 24, thickness: 3, stars: 2, duration: 5, trailLength: 0.5, glow: 1 });

  initClickSpark({ color: '#2A9D8F', size: 12, radius: 24, count: 8 });
})();
