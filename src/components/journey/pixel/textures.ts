/**
 * Minecraft block textures for the piece1 + piece2 pixel scenes.
 *
 * Sources: vanilla Java resource-pack textures (16x16), catalogued on
 * minecraft.wiki/w/List_of_block_textures, fetched from the
 * InventivetalentDev/minecraft-assets mirror. Files live in
 * public/textures/mc/ (gitignored, same as every other art asset).
 *
 * Several vanilla textures ship greyscale and are biome-tinted in-game
 * (leaves, grass, vines, water). `loadTextures()` bakes those tints onto
 * offscreen canvases once, so the renderer can just blit.
 */

export const TILE = 16;

export type TexKey =
  | "stone"
  | "cobblestone"
  | "mossy_cobblestone"
  | "stone_bricks"
  | "mossy_stone_bricks"
  | "moss_block"
  | "gravel"
  | "dirt"
  | "grass_block_top"
  | "grass_block_side"
  | "oak_log"
  | "oak_log_top"
  | "oak_leaves"
  | "azalea_leaves"
  | "flowering_azalea_leaves"
  | "vine"
  | "snow"
  | "water_still"
  | "jungle_leaves"
  | "spruce_leaves"
  | "birch_leaves"
  | "dark_oak_leaves"
  | "jungle_log"
  | "glow_lichen";

const FILE: Record<TexKey, string> = {
  stone: "stone.png",
  cobblestone: "cobblestone.png",
  mossy_cobblestone: "mossy_cobblestone.png",
  stone_bricks: "stone_bricks.png",
  mossy_stone_bricks: "mossy_stone_bricks.png",
  moss_block: "moss_block.png",
  gravel: "gravel.png",
  dirt: "dirt.png",
  grass_block_top: "grass_block_top.png",
  grass_block_side: "grass_block_side.png",
  oak_log: "oak_log.png",
  oak_log_top: "oak_log_top.png",
  oak_leaves: "oak_leaves.png",
  azalea_leaves: "azalea_leaves.png",
  flowering_azalea_leaves: "flowering_azalea_leaves.png",
  vine: "vine.png",
  snow: "snow.png",
  water_still: "water_still.png",
  jungle_leaves: "jungle_leaves.png",
  spruce_leaves: "spruce_leaves.png",
  birch_leaves: "birch_leaves.png",
  dark_oak_leaves: "dark_oak_leaves.png",
  jungle_log: "jungle_log.png",
  glow_lichen: "glow_lichen.png",
};

/** rgb multiply tint for the greyscale-in-game textures (jungle-leaning) */
const TINT: Partial<Record<TexKey, string>> = {
  grass_block_top: "#7cb646",
  grass_block_side: "#7cb646", // applied to the top strip only
  oak_leaves: "#6fae3a",
  vine: "#5c8f2c",
  water_still: "#3a6fd8",
  jungle_leaves: "#5c8544",
  spruce_leaves: "#4d6349",
  birch_leaves: "#84934f",
  dark_oak_leaves: "#465a3c",
  glow_lichen: "#63d7b0",
};

/** water_still.png is a vertical strip of 16x16 frames */
export const WATER_FRAMES = 32;

export type TexSet = Record<TexKey, HTMLCanvasElement>;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`texture failed: ${src}`));
    img.src = src;
  });
}

/** draw `img` to a fresh canvas, optionally multiply-tinting (all of it, or
 *  just the top `tintRows` px for the grass side strip). */
function bake(
  img: HTMLImageElement,
  tint?: string,
  tintRows?: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0);
  if (tint) {
    g.globalCompositeOperation = "multiply";
    g.fillStyle = tint;
    g.fillRect(0, 0, c.width, tintRows ?? c.height);
    // restore alpha eaten by the opaque fill
    g.globalCompositeOperation = "destination-in";
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = "source-over";
  }
  return c;
}

let cache: TexSet | null = null;

export async function loadTextures(basePath = "/textures/mc"): Promise<TexSet> {
  if (cache) return cache;
  const keys = Object.keys(FILE) as TexKey[];
  const imgs = await Promise.all(keys.map((k) => loadImage(`${basePath}/${FILE[k]}`)));
  const set = {} as TexSet;
  keys.forEach((k, i) => {
    set[k] = bake(
      imgs[i],
      TINT[k],
      k === "grass_block_side" ? 5 : undefined,
    );
  });
  cache = set;
  return set;
}
