/**
 * A print peeling off the film like a soft handkerchief, drawn with WebGL
 * (Peel, in `printMotion.ts`).
 *
 * The sheet is a fine mesh carrying the frame's picture. Each time it peels
 * from somewhere new — a bottom corner, the middle of an edge, the very
 * centre (like a handkerchief lifted by a pinch) — and the peel spreads out
 * from there across the sheet. It's one continuous movement: each point of
 * the sheet starts on its way the moment the peel frees it, curling up toward
 * you, rippling softly and flattening out again as it floats to the front of
 * the screen — the point it was lifted by leading, the far side trailing —
 * until it settles flat, exactly where the print is, so the print can take
 * over.
 *
 * Everything is worked out on the CPU from the progress (0–1) the caller
 * draws at — a few hundred points a frame, without making any garbage — and
 * the GPU draws it in one call. One WebGL context serves every print, set up
 * once (`warmCloth`, ahead of the first click), so opening one costs only
 * the picture's upload. Positions are CSS pixels on the screen, with depth
 * toward the viewer seen through a camera 1100px from the middle of the view,
 * so a sheet lying flat lines up with the page to the pixel.
 */

type Wave = {
  /** direction it travels across the sheet */
  dx: number;
  dy: number;
  /** ripples per sheet width, in radians */
  k: number;
  /** how fast it travels */
  speed: number;
  /** height, in sheet widths */
  amp: number;
  phase: number;
};

export type ClothConfig = {
  /** where the peel starts, across (0–1) and down (0–1) the sheet */
  ox: number;
  oy: number;
  /** the curl's radius, in sheet widths, and how far it turns (radians) */
  curlR: number;
  curlMax: number;
  /** how much the freed paper droops back */
  sag: number;
  waves: Wave[];
  /** how far it floats toward you on the way (px), and its turn (radians) */
  lift: number;
  tilt: number;
};

/** where a peel can start — edges and corners mostly, the bottom most of all */
const ORIGINS: [number, number][] = [
  [0, 1],
  [1, 1],
  [0.5, 1],
  [0, 1],
  [1, 1],
  [0.5, 0.5],
  [0, 0],
  [1, 0],
  [0, 0.6],
  [1, 0.4],
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/** a new handkerchief: a different peel, ripple and float every time */
export function randomCloth(curl: number): ClothConfig {
  const r = Math.random;
  const [ox, oy] = ORIGINS[Math.floor(r() * ORIGINS.length)];
  const jitter = (v: number) => clamp01(v + (r() - 0.5) * 0.16);
  return {
    ox: jitter(ox),
    oy: jitter(oy),
    curlR: (0.13 + r() * 0.07) / Math.sqrt(curl),
    curlMax: Math.min(2, (0.55 + r() * 0.4) * curl),
    sag: 0.25 + r() * 0.35,
    waves: Array.from({ length: 3 }, (_, i) => {
      const a = r() * Math.PI * 2;
      return {
        dx: Math.cos(a),
        dy: Math.sin(a),
        k: (Math.PI * 2) / (0.55 + r() * 0.6),
        speed: 5 + r() * 4,
        amp: (i === 0 ? 0.035 : 0.018) * (0.7 + r() * 0.6) * Math.sqrt(curl),
        phase: r() * Math.PI * 2,
      };
    }),
    lift: 50 + r() * 70,
    tilt: (r() - 0.5) * 0.16,
  };
}

/** by when (0–1) the peel has spread across the whole sheet — it speeds up
 *  as it goes (`FRONT_POW`), so it runs straight on into the flight */
const PEEL_END = 0.3;
const FRONT_POW = 1.35;
/** the camera's distance from the screen (CSS px), as CSS perspective */
const CAMERA = 1100;
/** light from above, to the left, in front — a flat sheet is lit 1:1 */
const [LX, LY, LZ] = (() => {
  const n = Math.hypot(-0.35, -0.55, 1);
  return [-0.35 / n, -0.55 / n, 1 / n];
})();
/** the mesh: fine enough that its folds look smooth */
const COLS = 30;

const VERT = `
attribute vec3 aPos;
attribute vec2 aUv;
attribute float aShade;
uniform vec2 uView;
uniform float uCamera;
varying vec2 vUv;
varying float vShade;
void main() {
  vec2 mid = uView * 0.5;
  float k = uCamera / max(uCamera - aPos.z, 1.0);
  vec2 s = mid + (aPos.xy - mid) * k;
  gl_Position = vec4(s.x / uView.x * 2.0 - 1.0, 1.0 - s.y / uView.y * 2.0, clamp(-aPos.z / 4000.0, -1.0, 1.0), 1.0);
  vUv = aUv;
  vShade = aShade;
}`;

// the paper's back is white; a shade below zero means the back is showing
const FRAG = `
precision mediump float;
uniform sampler2D uTex;
varying vec2 vUv;
varying float vShade;
void main() {
  vec3 col = vShade >= 0.0 ? texture2D(uTex, vUv).rgb : vec3(0.93, 0.93, 0.91);
  gl_FragColor = vec4(col * abs(vShade), 1.0);
}`;

/** a sheet bent round a curl of radius `r`, turning at most `max`: how far
 *  `s` of paper behind the peel's front reaches back along the film, and up
 *  off it — written into `out`, so the hot loop makes no garbage */
function curlOf(s: number, r: number, max: number, out: Float64Array) {
  const arc = r * max;
  if (s <= arc) {
    out[0] = r * Math.sin(s / r);
    out[1] = r * (1 - Math.cos(s / r));
  } else {
    const rest = s - arc;
    out[0] = r * Math.sin(max) + rest * Math.cos(max);
    out[1] = r * (1 - Math.cos(max)) + rest * Math.sin(max);
  }
}

/* ── the one WebGL context ──────────────────────────────────────────────────── */

type Stage = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  posBuf: WebGLBuffer;
  shadeBuf: WebGLBuffer;
  uvBuf: WebGLBuffer;
  tex: WebGLTexture;
  uView: WebGLUniformLocation | null;
  /** the mesh it's sized for, and its index count */
  rows: number;
  indices: number;
  pos: Float32Array;
  shade: Float32Array;
  uv: Float32Array;
};

/** undefined: not tried yet; null: no WebGL here */
let stage: Stage | null | undefined;
/** bumped each time a sheet is set up, so an older one stops drawing */
let generation = 0;

function setUp(): Stage | null {
  if (stage !== undefined) return stage;
  stage = null;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.className = "fx-cloth";
  const gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: true, alpha: true });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const attrib = (name: string, size: number) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    const loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    return b;
  };
  const posBuf = attrib("aPos", 3);
  const shadeBuf = attrib("aShade", 1);
  const uvBuf = attrib("aUv", 2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.uniform1f(gl.getUniformLocation(program, "uCamera"), CAMERA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);

  stage = {
    canvas,
    gl,
    posBuf,
    shadeBuf,
    uvBuf,
    tex,
    uView: gl.getUniformLocation(program, "uView"),
    rows: 0,
    indices: 0,
    pos: new Float32Array(0),
    shade: new Float32Array(0),
    uv: new Float32Array(0),
  };
  return stage;
}

/** builds the mesh for a sheet `rows` deep, if it isn't built already */
function mesh(st: Stage, rows: number) {
  if (st.rows === rows) return;
  const { gl } = st;
  const count = (COLS + 1) * (rows + 1);
  st.rows = rows;
  st.pos = new Float32Array(count * 3);
  st.shade = new Float32Array(count);
  st.uv = new Float32Array(count * 2);
  const index = new Uint16Array(COLS * rows * 6);
  let w = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = j * (COLS + 1) + i;
      const b = a + 1;
      const c = a + COLS + 1;
      const d = c + 1;
      index.set([a, b, c, b, d, c], w);
      w += 6;
    }
  }
  st.indices = index.length;
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, st.posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, st.pos, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, st.shadeBuf);
  gl.bufferData(gl.ARRAY_BUFFER, st.shade, gl.DYNAMIC_DRAW);
}

/** gets WebGL ready ahead of the first print, so the first click doesn't
 *  wait on it — call it while nothing much is happening */
export function warmCloth() {
  setUp();
}

export type Cloth = {
  /** the canvas it draws on, laid over the whole view */
  canvas: HTMLCanvasElement;
  /** draws the sheet at `p` (0 on the film, 1 settled as the print) */
  draw: (p: number) => void;
  /** still the sheet on show — a newer one takes the canvas over */
  live: () => boolean;
};

/**
 * Sets up a sheet between the frame's picture on the film (`from`) and the
 * print's (`to`). `picture` is what's on it: the frame's own image, already
 * loaded, or a canvas standing in. `place` lays the canvas over the whole
 * view, so it can be sized. Null where WebGL isn't to be had.
 */
export function createCloth(
  place: (canvas: HTMLCanvasElement) => void,
  picture: HTMLImageElement | HTMLCanvasElement,
  from: DOMRect,
  to: DOMRect,
  cfg: ClothConfig,
): Cloth | null {
  const st = setUp();
  if (!st) return null;
  const { gl, canvas } = st;
  const mine = ++generation;
  place(canvas);

  const view = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(view.width * dpr);
  const height = Math.round(view.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, width, height);
  gl.uniform2f(st.uView, view.width, view.height);

  try {
    gl.bindTexture(gl.TEXTURE_2D, st.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, picture);
  } catch {
    return null;
  }

  const aspect = to.height / to.width;
  const rows = Math.max(8, Math.round(COLS * aspect));
  mesh(st, rows);
  const { pos, shade, uv } = st;

  // the picture is cropped to fill the sheet, as `object-cover` crops it
  const pw = picture instanceof HTMLImageElement ? picture.naturalWidth : picture.width;
  const ph = picture instanceof HTMLImageElement ? picture.naturalHeight : picture.height;
  const over = pw / ph / (to.width / to.height);
  const [u0, u1] = over > 1 ? [0.5 - 0.5 / over, 0.5 + 0.5 / over] : [0, 1];
  const [v0, v1] = over < 1 ? [0.5 - 0.5 * over, 0.5 + 0.5 * over] : [0, 1];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= COLS; i++) {
      const n = j * (COLS + 1) + i;
      uv[n * 2] = u0 + (i / COLS) * (u1 - u0);
      uv[n * 2 + 1] = v0 + (j / rows) * (v1 - v0);
    }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, st.uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

  // where on the sheet the peel starts, and the farthest the peel must
  // reach to free it all — in sheet widths, the sheet `aspect` tall
  const ox = cfg.ox;
  const oy = cfg.oy * aspect;
  const reach =
    Math.max(
      Math.hypot(ox, oy),
      Math.hypot(1 - ox, oy),
      Math.hypot(ox, aspect - oy),
      Math.hypot(1 - ox, aspect - oy),
    ) + 0.02;

  const fx = from.left + from.width / 2 - view.left;
  const fy = from.top + from.height / 2 - view.top;
  const tx = to.left + to.width / 2 - view.left;
  const ty = to.top + to.height / 2 - view.top;
  const curl = new Float64Array(2);

  function draw(p: number) {
    if (generation !== mine) return;
    // the peel's front, spreading out from where it started, quicker as it
    // goes — there's no pause before the sheet is off and away
    const front = reach * clamp01(p / PEEL_END) ** FRONT_POW;
    const spin = cfg.tilt * Math.sin(Math.PI * easeInOut(p));
    const cos = Math.cos(spin);
    const sin = Math.sin(spin);
    const flutter = p * 3;

    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= COLS; i++) {
        const n = j * (COLS + 1) + i;
        const x = i / COLS;
        const y = (j / rows) * aspect;
        const ex = x - ox;
        const ey = y - oy;
        const d = Math.hypot(ex, ey);
        const dirX = d > 1e-6 ? ex / d : 0;
        const dirY = d > 1e-6 ? ey / d : -1;

        // this point is on its way from the moment the peel reaches it, and
        // lands with everything else — so the lifted point leads and the
        // far side trails, all in the one movement
        const freedAt = PEEL_END * (d / reach) ** (1 / FRONT_POW);
        const qv = clamp01((p - freedAt) / (1 - freedAt));
        const travel = easeInOut(qv);

        // freed from the film: curled up off it behind the front, and
        // flattening out again as it travels
        const s = Math.max(0, front - d);
        curlOf(s, cfg.curlR, cfg.curlMax, curl);
        const keep = 1 - smooth(qv / 0.6);
        // right by where it was lifted, the paper only rises (a pinch, not
        // a fold), so the curl's pull along the film fades in away from it
        const pull = smooth(d / (cfg.curlR * 2)) * (s - curl[0]) * keep;
        // soft, not stiff: the freed paper droops back as it reaches out
        let dz = Math.max(0, curl[1] - cfg.sag * Math.max(0, s - cfg.curlR) ** 2) * keep;

        // ripples run through whatever is free, and die away as it settles
        const ripple = 0.6 * smooth(s / 0.25) * (1 + 0.6 * Math.sin(Math.PI * qv)) * (1 - smooth(qv / 0.9));
        if (ripple > 0) {
          let wave = 0;
          for (const wv of cfg.waves) {
            wave += wv.amp * Math.sin(wv.k * (wv.dx * x + wv.dy * y) - wv.speed * flutter + wv.phase);
          }
          dz += wave * ripple;
        }

        // onto the screen: its place on the way from the frame to the
        // print, turned a touch, floating out toward you mid-way
        const w = from.width + (to.width - from.width) * travel;
        const cx = fx + (tx - fx) * travel;
        const cy = fy + (ty - fy) * travel;
        const lx = (x + dirX * pull - 0.5) * w;
        const ly = (y + dirY * pull - aspect / 2) * w;
        pos[n * 3] = cx + lx * cos - ly * sin;
        pos[n * 3 + 1] = cy + lx * sin + ly * cos;
        pos[n * 3 + 2] = dz * w + cfg.lift * Math.sin(Math.PI * qv);
      }
    }

    // light each point by which way the sheet faces there
    const stride = (COLS + 1) * 3;
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= COLS; i++) {
        const right = j * stride + Math.min(COLS, i + 1) * 3;
        const left = j * stride + Math.max(0, i - 1) * 3;
        const down = Math.min(rows, j + 1) * stride + i * 3;
        const up = Math.max(0, j - 1) * stride + i * 3;
        const ux = pos[right] - pos[left];
        const uy = pos[right + 1] - pos[left + 1];
        const uz = pos[right + 2] - pos[left + 2];
        const vx = pos[down] - pos[up];
        const vy = pos[down + 1] - pos[up + 1];
        const vz = pos[down + 2] - pos[up + 2];
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        const lit = (nx * LX + ny * LY + nz * LZ) / len / LZ;
        const level = Math.min(1.12, Math.max(0.4, Math.abs(lit)));
        shade[j * (COLS + 1) + i] = nz >= 0 ? level : -level;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, st!.posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, st!.shadeBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, shade);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, st!.indices, gl.UNSIGNED_SHORT, 0);
  }

  return {
    canvas,
    draw,
    live: () => generation === mine && canvas.isConnected,
  };
}

/** a stand-in picture for a frame that hasn't got one yet — the placeholder's
 *  umber glass and its file name */
export function placeholderPicture(slug: string) {
  const c = document.createElement("canvas");
  c.width = 600;
  c.height = 400;
  const g = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const bg = css.getPropertyValue("--screen-bg").trim() || "#573914";
  const glow = css.getPropertyValue("--glow").trim() || "#ffbe5c";
  const deep = css.getPropertyValue("--screen-deep").trim() || "#1a1106";
  const grad = g.createRadialGradient(180, 100, 0, 180, 100, 520);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, deep);
  g.fillStyle = grad;
  g.fillRect(0, 0, 600, 400);
  g.fillStyle = glow;
  g.globalAlpha = 0.75;
  g.font = "28px monospace";
  g.textAlign = "center";
  g.fillText(`${slug}.png`, 300, 290);
  return c;
}
