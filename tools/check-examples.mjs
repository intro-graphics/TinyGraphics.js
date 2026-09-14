// Load every example (and main-scene.js) in headless Chromium with real WebGL 2, press every
// control button, and fail on console errors, the error overlay, or a blank canvas.
// Screenshots go to tools/shots/ — look at them; a passing check does not mean it looks right.
//     node tools/check-examples.mjs          (Playwright's cached Chromium)
//     CHROME=/path/to/chrome node tools/check-examples.mjs
import {chromium} from 'playwright-core';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {examples} from '../examples/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, 'shots');
await mkdir(shots, {recursive: true});
const port = 8771, server = await serve(port);

// Code shown in the docs must run too: extract it into tools/.doc-snippets/ and load it like an example.
const snippets = join(here, '.doc-snippets');
await mkdir(snippets, {recursive: true});
const js_blocks = md => [...md.matchAll(/```js\n([\s\S]*?)```/g)].map(m => m[1]);
const readme_scene = js_blocks(await readFile(join(here, '..', 'README.md'), 'utf8')).find(b => b.includes('class Main_Scene'));
const shader_doc = js_blocks(await readFile(join(here, '..', 'docs', '03-shaders.md'), 'utf8')).find(b => b.includes('class Normal_Color_Shader'));
await writeFile(join(snippets, 'readme-scene.js'), readme_scene.replaceAll("'./common.js'", "'../../common.js'"));
await writeFile(join(snippets, 'shader-doc.js'), shader_doc.replaceAll("'./common.js'", "'../../common.js'"));
await writeFile(join(snippets, 'index.html'), `<!doctype html><meta charset="utf-8"><div id="c"></div>
<script type="module">
import {tiny, defs} from '../../common.js';
import {Main_Scene} from './readme-scene.js';
import {Normal_Color_Shader} from './shader-doc.js';
const which = new URLSearchParams(location.search).get('snippet');
class Shader_Doc_Scene extends tiny.Scene {
    constructor() { super(); this.ball = new defs.Subdivision_Sphere(4); this.m = new tiny.Material(new Normal_Color_Shader()); }
    display(context, ps) {
        ps.set_camera(tiny.Mat4.look_at(tiny.vec3(0, 0, 4), tiny.vec3(0, 0, 0), tiny.vec3(0, 1, 0)));
        ps.projection_transform = tiny.Mat4.perspective(Math.PI / 4, context.aspect_ratio, .1, 100);
        this.ball.draw(context, ps, tiny.Mat4.scale(1.5, 1, 1), this.m);
    }
}
new tiny.Canvas_Widget(document.getElementById('c'), [which === 'shader' ? new Shader_Doc_Scene() : new Main_Scene()]);
</script>`);

const launch = {headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']};
if (process.env.CHROME) launch.executablePath = process.env.CHROME;
const browser = await chromium.launch(launch);
const page = await browser.newPage({viewport: {width: 1200, height: 900}, deviceScaleFactor: 1});

let failures = 0;
const fail = (name, msg) => {
    failures++;
    console.log(`  FAIL ${name}: ${msg}`);
};

async function distinct_colours(png) {
    return page.evaluate(async b64 => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = new OffscreenCanvas(img.width, img.height), g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, img.width, img.height).data, seen = new Set();
        for (let i = 0; i < d.length; i += 4 * 7) seen.add((d[i] >> 3) << 10 | (d[i + 1] >> 3) << 5 | (d[i + 2] >> 3));
        return seen.size;
    }, png.toString('base64'));
}

const pages = [['Main_Scene', ''], ...Object.keys(examples).map(n => [n, '?scene=' + n]),
    ['doc-README-scene', 'tools/.doc-snippets/?snippet=readme'], ['doc-03-shader', 'tools/.doc-snippets/?snippet=shader']];
for (const [label, path] of pages) {
    const errors = [];
    const on_console = m => { if (m.type() === 'error') errors.push(m.text()); };
    const on_error = e => errors.push(String(e));
    page.on('console', on_console);
    page.on('pageerror', on_error);

    await page.goto(`http://127.0.0.1:${port}/${path}`);
    await page.waitForTimeout(1500);
    const shoot = async suffix => {
        const canvases = page.locator('canvas:visible');
        if (!await canvases.count()) return fail(label, 'no visible canvas');
        const png = await canvases.first().screenshot({path: join(shots, `${label}${suffix}.png`)});
        const n = await distinct_colours(png);
        if (n < 5) fail(label + suffix, `canvas looks blank (${n} distinct colours)`);
        return n;
    };
    const colours = await shoot('');

    // Press every button once (pointer down/up), then let a few frames run.
    const buttons = page.locator('.tg-panel button');
    for (let i = 0; i < await buttons.count(); i++) {
        const b = buttons.nth(i);
        if (!await b.isVisible()) continue;
        await b.dispatchEvent('pointerdown');
        await b.dispatchEvent('pointerup');
    }
    await page.waitForTimeout(500);
    await shoot('.after-buttons');

    const overlay = await page.locator('.tg-error').allTextContents();
    for (const text of overlay) fail(label, 'error overlay: ' + text.split('\n').slice(0, 4).join(' | '));
    for (const e of errors) fail(label, e.split('\n').slice(0, 3).join(' | '));
    if (!errors.length && !overlay.length) console.log(`  ok   ${label} (${colours} colours)`);
    page.off('console', on_console);
    page.off('pageerror', on_error);
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall examples passed; screenshots in tools/shots/');
process.exit(failures ? 1 : 0);
