/**
 * @file tiny-graphics-widgets.js — page panels around a TinyGraphics.js canvas:
 * the canvas itself, per-scene control panels, an explanation area, and a code viewer.
 */

import {tiny} from './tiny-graphics.js';

const {color} = tiny;

export const widgets = {};

// All widget styling lives here, injected once.  Layout is fluid: the widget fills its container
// up to --tg-max-width, so it works on laptops and phones alike.  The look: warm paper, ink rules,
// key-cap buttons, and red / yellow / blue used sparingly as markers.  Override the --tg-* tokens to re-theme.
const STYLE = `
.tg-widget { --tg-max-width: 1080px; --tg-paper: #e9e6df; --tg-surface: #fbfaf7; --tg-ink: #16161a; --tg-muted: #6f6b64;
  --tg-hair: #dcd8cf; --tg-red: #e0351f; --tg-yellow: #f2b200; --tg-blue: #1f4ea3; --tg-orange: #ff5b1f; --tg-rule: 1.5px;
  --tg-sans: "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;
  --tg-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  max-width: var(--tg-max-width); margin: 0 auto; font: 14px/1.5 var(--tg-sans); color: var(--tg-ink); }
.tg-widget *, .tg-widget *::before { box-sizing: border-box; }
.tg-widget canvas { display: block; width: 100%; background: var(--tg-paper); touch-action: none; }
.tg-canvas-wrap { position: relative; border: var(--tg-rule) solid var(--tg-ink); }
.tg-error { position: absolute; inset: 0; margin: 0; padding: 16px; overflow: auto; background: rgba(22, 22, 26, .94); color: #f7f5f0;
  font: 12px/1.5 var(--tg-mono); white-space: pre-wrap; }
.tg-error b { color: var(--tg-orange); }

.tg-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: var(--tg-rule);
  background: var(--tg-ink); border: var(--tg-rule) solid var(--tg-ink); margin-top: calc(-1 * var(--tg-rule)); }
.tg-controls:empty { display: none; }
.tg-panel { background: var(--tg-surface); padding: 0 14px 14px; min-width: 0; font-size: 13px; }
.tg-panel-title { display: flex; align-items: center; gap: 8px; margin: 0 -14px 10px; padding: 7px 14px;
  border-bottom: 1px solid var(--tg-hair); font: 600 10.5px/1.4 var(--tg-mono); letter-spacing: .1em; text-transform: uppercase; }
.tg-panel-title::before { content: ""; width: 9px; height: 9px; background: var(--tg-marker, var(--tg-red)); }
.tg-panel:nth-child(3n+2) { --tg-marker: var(--tg-blue); }
.tg-panel:nth-child(3n+3) { --tg-marker: var(--tg-yellow); }
.tg-break { height: 4px; }
.tg-panel button { display: inline-flex; align-items: center; gap: 8px; margin: 3px 6px 3px 0; padding: 3px 10px 3px 3px; min-height: 30px;
  background: #fff; color: var(--tg-ink); border: var(--tg-rule) solid var(--tg-ink); border-radius: 5px; box-shadow: 0 2px 0 var(--tg-ink);
  font: 500 12.5px/1.2 var(--tg-sans); cursor: pointer; user-select: none; transition: transform .05s, box-shadow .05s, background-color .12s; }
.tg-panel button:not(:has(kbd)) { padding-left: 10px; }
.tg-panel button:hover { background: #fff6d6; }
.tg-panel button.pressed { transform: translateY(2px); box-shadow: 0 0 0 var(--tg-ink); background: var(--tg-orange); }
.tg-panel button:focus-visible { outline: 2px solid var(--tg-orange); outline-offset: 2px; }
.tg-panel kbd { display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 3px;
  background: var(--tg-ink); color: #fbfaf7; font: 600 11px/1 var(--tg-mono); }
.tg-panel .live_string { display: inline-block; margin: 2px 0; font: 12px/1.6 var(--tg-mono); font-variant-numeric: tabular-nums; }
.tg-panel label.slider { display: flex; flex-direction: column; align-items: stretch; text-align: left; gap: 2px; margin: 6px 0 2px; font: 12px/1.4 var(--tg-mono); }
.tg-panel label.slider input { width: 100%; height: 22px; margin: 0; background: transparent; -webkit-appearance: none; appearance: none; }
.tg-panel label.slider input::-webkit-slider-runnable-track { height: 2px; background: var(--tg-ink); }
.tg-panel label.slider input::-moz-range-track { height: 2px; background: var(--tg-ink); }
.tg-panel label.slider input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -6px;
  background: var(--tg-orange); border: var(--tg-rule) solid var(--tg-ink); border-radius: 0; }
.tg-panel label.slider input::-moz-range-thumb { width: 12px; height: 12px; background: var(--tg-orange); border: var(--tg-rule) solid var(--tg-ink); border-radius: 0; }

.tg-explanation { padding: 16px 20px; background: var(--tg-surface); border: var(--tg-rule) solid var(--tg-ink); margin-top: calc(-1 * var(--tg-rule)); line-height: 1.65; }
.tg-explanation:empty { display: none; }
.tg-explanation > p:first-child { margin-top: 0; }
.tg-explanation > p:last-child { margin-bottom: 0; }
.tg-explanation p { max-width: 76ch; }
.tg-explanation a { color: inherit; text-decoration-color: var(--tg-orange); text-decoration-thickness: 2px; text-underline-offset: 3px; }
.tg-explanation code { font: .9em var(--tg-mono); }
.tg-explanation .tg-widget { margin: 20px 0 0; }

.tg-code { margin-top: 28px; border: var(--tg-rule) solid var(--tg-ink); background: var(--tg-surface); }
.tg-code-bar { display: flex; align-items: center; gap: 12px; min-height: 40px; padding: 6px 12px; border-bottom: var(--tg-rule) solid var(--tg-ink); }
.tg-code-bar .tg-label { font: 600 10.5px/1 var(--tg-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--tg-muted); }
.tg-code-bar .tg-name { font: 600 14px/1.2 var(--tg-mono); }
.tg-code-bar .tg-kind { font: 10.5px/1 var(--tg-mono); letter-spacing: .08em; text-transform: uppercase; padding: 3px 6px; border: 1px solid var(--tg-ink); }
.tg-code-bar button { margin-left: auto; padding: 4px 10px; background: #fff; border: var(--tg-rule) solid var(--tg-ink); border-radius: 5px;
  box-shadow: 0 2px 0 var(--tg-ink); font: 500 12px/1.2 var(--tg-sans); cursor: pointer; }
.tg-code-bar button:disabled { opacity: .35; cursor: default; }
.tg-code-bar button:not(:disabled):active { transform: translateY(2px); box-shadow: none; }
.tg-code-body { display: grid; grid-template-columns: 236px minmax(0, 1fr); }
.tg-code-body.no-nav { grid-template-columns: minmax(0, 1fr); }
.tg-class-index { max-height: 600px; overflow: auto; border-right: var(--tg-rule) solid var(--tg-ink); padding: 10px 0 14px; }
.tg-class-index input { display: block; width: calc(100% - 24px); margin: 0 12px 6px; padding: 6px 8px; border: 1px solid var(--tg-ink);
  border-radius: 0; background: #fff; font: 12px/1.2 var(--tg-mono); }
.tg-class-index input:focus { outline: 2px solid var(--tg-orange); outline-offset: -1px; }
.tg-class-index h4 { display: flex; align-items: center; gap: 8px; margin: 12px 12px 4px; font: 600 10.5px/1 var(--tg-mono);
  letter-spacing: .1em; text-transform: uppercase; }
.tg-class-index h4 i { width: 9px; height: 9px; background: var(--tg-marker); }
.tg-class-index h4 small { margin-left: auto; font-weight: 400; color: var(--tg-muted); }
.tg-class-index ul { margin: 0; padding: 0; list-style: none; }
.tg-class-index a { display: block; padding: 2px 12px 2px 29px; font: 12.5px/1.6 var(--tg-mono); color: var(--tg-ink); cursor: pointer; text-decoration: none; }
.tg-class-index a:hover { background: #fff6d6; }
.tg-class-index a.current { background: var(--tg-ink); color: #fbfaf7; }
.tg-code-view { display: flex; max-height: 600px; overflow: auto; background: #fff; }
.tg-gutter, .tg-code-panel { margin: 0; padding: 12px 0; font: 12.5px/1.6 var(--tg-mono); white-space: pre; }
.tg-gutter { position: sticky; left: 0; flex: none; padding: 12px 10px 12px 12px; text-align: right; color: #b5b0a6; background: #fff;
  border-right: 1px solid var(--tg-hair); user-select: none; }
.tg-code-panel { flex: 1; padding-left: 14px; padding-right: 16px; tab-size: 4; }
.tg-code-panel a { color: inherit; cursor: pointer; text-decoration: none; box-shadow: inset 0 -.42em 0 rgba(242, 178, 0, .45); }
.tg-code-panel a:hover { box-shadow: inset 0 -1.2em 0 rgba(242, 178, 0, .6); }
@media (max-width: 760px) {
  .tg-code-body { grid-template-columns: minmax(0, 1fr); }
  .tg-class-index { max-height: 240px; border-right: 0; border-bottom: var(--tg-rule) solid var(--tg-ink); }
}
`;

function inject_style() {
    if (document.getElementById("tg-style")) return;
    document.head.appendChild(Object.assign(document.createElement("style"), {id: "tg-style", textContent: STYLE}));
}

/**
 * **Canvas_Widget** — puts a WebGL canvas inside `element`, followed by the optional control panels,
 * explanation and code viewer, and starts drawing `scenes` on it.
 *   new Canvas_Widget(element, [new My_Scene()], {aspect: 16 / 9, make_controls: true,
 *                     show_explanation: true, make_code_nav: false, background: defs.palette.paper})
 * A scene may also set `this.widget_options = {...}` to override these.
 */
const Canvas_Widget = widgets.Canvas_Widget =
    class Canvas_Widget {
        constructor(element, initial_scenes = [], options = {}) {
            inject_style();
            this.element = element;
            element.classList.add("tg-widget");
            const defaults = {
                show_canvas: true, make_controls: true, show_explanation: true, make_code_nav: false,
                aspect: 16 / 9, background: color(.914, .902, .875, 1), definitions: undefined
            };
            Object.assign(this, defaults, options, (initial_scenes[0] && initial_scenes[0].widget_options) || {});

            const wrap = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-canvas-wrap"}));
            const canvas = wrap.appendChild(document.createElement("canvas"));
            canvas.style.aspectRatio = String(this.aspect);
            if (!this.show_canvas) wrap.style.display = "none";

            if (this.make_controls)
                this.embedded_controls_area = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-controls"}));
            if (this.show_explanation)
                this.embedded_explanation_area = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-explanation"}));
            if (this.make_code_nav)
                this.embedded_code_nav_area = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-code"}));

            const show_error = error => {
                console.error(error);
                const box = wrap.appendChild(Object.assign(document.createElement("pre"), {className: "tg-error"}));
                const title = document.createElement("b");
                title.textContent = "The render loop stopped because of an error:\n\n";
                box.append(title, String(error && error.message || error),
                    error && error.stack ? "\n\n" + error.stack.split("\n").slice(1, 6).join("\n") : "");
            };
            try {
                this.webgl_manager = new tiny.Webgl_Manager(canvas, this.background, {on_error: show_error});
            } catch (error) {
                show_error(error);
                return;
            }
            this.webgl_manager.scenes.push(...initial_scenes);

            if (this.show_explanation)
                this.embedded_explanation = new Text_Widget(this.embedded_explanation_area, this.webgl_manager.scenes, this.webgl_manager);
            if (this.make_controls)
                this.embedded_controls = new Controls_Widget(this.embedded_controls_area, this.webgl_manager.scenes);
            if (this.make_code_nav && initial_scenes[0])
                this.embedded_code_nav = new Code_Widget(this.embedded_code_nav_area, initial_scenes[0].constructor,
                    {definitions: this.definitions});

            this.webgl_manager.render();
        }
    };

/**
 * **Controls_Widget** — one panel per Scene (children included), filled by each scene's
 * make_control_panel().  Rebuilt automatically when a new child scene appears.
 */
const Controls_Widget = widgets.Controls_Widget =
    class Controls_Widget {
        constructor(element, scenes) {
            inject_style();
            Object.assign(this, {element, scenes, panels: [], known: new Set()});
            this.render();
        }

        all_scenes() {
            const found = [], open_list = [...this.scenes];
            while (open_list.length) {
                open_list.push(...open_list[0].children);
                found.push(open_list.shift());
            }
            return found;
        }

        make_panels() {
            this.element.innerHTML = "";
            this.panels = [];
            this.known = new Set();
            for (const scene of this.all_scenes()) {
                const panel = this.element.appendChild(Object.assign(document.createElement("div"), {className: "tg-panel"}));
                panel.appendChild(Object.assign(document.createElement("div"), {className: "tg-panel-title", textContent: scene.constructor.name}));
                const control_panel = panel.appendChild(document.createElement("div"));
                scene.control_panel = control_panel;
                scene.make_control_panel();
                if (!control_panel.childNodes.length) panel.remove();
                else this.panels.push(panel);
                this.known.add(scene);
            }
        }

        render() {
            if (this.all_scenes().some(s => !this.known.has(s))) this.make_panels();
            for (const panel of this.panels)
                for (const live_string of panel.querySelectorAll(".live_string")) live_string.onload(live_string);
            this.event = window.requestAnimationFrame(this.render.bind(this));
        }
    };

/**
 * **Code_Manager** — (internal) splits JavaScript source into tokens for syntax coloring.
 * The regular expression comes from https://github.com/lydell/js-tokens (MIT).
 */
const Code_Manager = widgets.Code_Manager =
    class Code_Manager {
        constructor(code) {
            const es6_tokens_parser = RegExp([
                /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!{)|\${(?:[^{}]|{[^}]*}?)*}?)*(`)?)/,
                /(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)/,
                /(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[-￿$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![-￿$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))/,
                /(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)/,
                /((?!\d)(?:(?!\s)[$\w-￿]|\\u[\da-fA-F]{4}|\\u{[\da-fA-F]+})+)/,
                /(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])/,
                /(\s+)|(^$|[\s\S])/
            ].map(r => r.source).join('|'), 'g');

            this.tokens = [];
            let single_token;
            while ((single_token = es6_tokens_parser.exec(code)) !== null) {
                const token = {type: "invalid", value: single_token[0]};
                if (single_token[1]) token.type = "string";
                else if (single_token[5] || single_token[6]) token.type = "comment";
                else if (single_token[8]) token.type = "regex";
                else if (single_token[9]) token.type = "number";
                else if (single_token[10]) token.type = "name";
                else if (single_token[11]) token.type = "punctuator";
                else if (single_token[12]) token.type = "whitespace";
                this.tokens.push(token);
            }
        }
    };

/**
 * **Code_Widget** — shows the source of a class, with every known class name clickable, next to an
 * index of all classes grouped by what they are for (math, rendering, appearance, shapes, shaders, scenes).
 *   new Code_Widget(element, Some_Class, {definitions: defs, hide_navigator: false})
 */
const Code_Widget = widgets.Code_Widget =
    class Code_Widget {
        static groups = [
            {name: "Math", marker: "var(--tg-ink)"}, {name: "Rendering", marker: "var(--tg-muted)"},
            {name: "Appearance", marker: "var(--tg-yellow)"}, {name: "Shapes", marker: "var(--tg-red)"},
            {name: "Shaders", marker: "var(--tg-blue)"}, {name: "Scenes", marker: "var(--tg-orange)"}];
        static keywords = new Set(("async await break case catch class const continue default delete do else export extends " +
            "false finally for function if import in instanceof let new null of return static super switch this throw true " +
            "try typeof undefined var void while yield").split(" "));

        constructor(element, class_to_show, {definitions = {}, hide_navigator = false} = {}) {
            inject_style();
            this.definitions = {...tiny, ...definitions};
            this.history = [];
            element.classList.add("tg-code");

            const bar = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-code-bar"}));
            bar.appendChild(Object.assign(document.createElement("span"), {className: "tg-label", textContent: "Source"}));
            this.name_display = bar.appendChild(Object.assign(document.createElement("span"), {className: "tg-name"}));
            this.kind_display = bar.appendChild(Object.assign(document.createElement("span"), {className: "tg-kind"}));
            const body = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-code-body"}));
            if (hide_navigator) body.classList.add("no-nav");
            else {
                this.back_button = bar.appendChild(Object.assign(document.createElement("button"), {textContent: "← Back", disabled: true}));
                this.back_button.addEventListener("click", () => {
                    this.history.pop();
                    this.display_code(this.history.pop());
                });
                this.make_index(body.appendChild(Object.assign(document.createElement("nav"), {className: "tg-class-index"})));
            }
            const view = this.code_view = body.appendChild(Object.assign(document.createElement("div"), {className: "tg-code-view"}));
            this.gutter = view.appendChild(Object.assign(document.createElement("pre"), {className: "tg-gutter", ariaHidden: "true"}));
            this.code_display = view.appendChild(Object.assign(document.createElement("pre"), {className: "tg-code-panel"}));
            if (class_to_show) this.display_code(class_to_show);
        }

        // group_of(): which index section a definition belongs to, judged by what it extends.
        group_of(name, value) {
            const is = base => base && (value === base || value.prototype instanceof base);
            if (is(tiny.Vertex_Buffer)) return "Shapes";
            if (is(tiny.Shader)) return "Shaders";
            if (is(tiny.Scene)) return "Scenes";
            if (/^[a-z]/.test(name) || ["Vector", "Vector3", "Vector4", "Matrix", "Mat4", "Color"].includes(name)) return "Math";
            if (["Light", "Material", "Texture", "Render_Target"].includes(name)) return "Appearance";
            return "Rendering";
        }

        make_index(nav) {
            const filter = nav.appendChild(Object.assign(document.createElement("input"),
                {type: "search", placeholder: "Filter classes", ariaLabel: "Filter classes"}));
            this.links = new Map();
            const sections = [];
            for (const {name: group, marker} of Code_Widget.groups) {
                const names = Object.keys(this.definitions)
                    .filter(n => typeof this.definitions[n] === "function" && this.group_of(n, this.definitions[n]) === group);
                if (!names.length) continue;
                const section = nav.appendChild(document.createElement("section"));
                const heading = section.appendChild(document.createElement("h4"));
                heading.style.setProperty("--tg-marker", marker);
                heading.append(document.createElement("i"), group, Object.assign(document.createElement("small"), {textContent: names.length}));
                const list = section.appendChild(document.createElement("ul"));
                for (const name of names) {
                    const link = list.appendChild(document.createElement("li"))
                        .appendChild(Object.assign(document.createElement("a"), {textContent: name}));
                    link.addEventListener("click", () => this.display_code(this.definitions[name]));
                    this.links.set(this.definitions[name], link);
                }
                sections.push(section);
            }
            filter.addEventListener("input", () => {
                const query = filter.value.trim().toLowerCase();
                for (const section of sections) {
                    let shown = 0;
                    for (const item of section.querySelectorAll("li"))
                        shown += !(item.hidden = !item.textContent.toLowerCase().includes(query));
                    section.hidden = !shown;
                }
            });
        }

        display_code(class_to_display) {
            if (!class_to_display) return;
            this.history.push(class_to_display);
            if (this.back_button) this.back_button.disabled = this.history.length < 2;
            this.name_display.textContent = class_to_display.name;
            const is_class = /^class\b/.test(class_to_display.toString());
            const kinds = {Shapes: "Shape", Shaders: "Shader", Scenes: "Scene"}, group = this.group_of(class_to_display.name, class_to_display);
            this.kind_display.textContent = is_class ? kinds[group] || group : "function";
            if (this.links) for (const [value, link] of this.links) link.classList.toggle("current", value === class_to_display);
            this.format_code(class_to_display.toString());
            this.code_view.scrollTop = 0;
        }

        format_code(code_string) {
            this.code_display.innerHTML = "";
            this.gutter.textContent = code_string.split("\n").map((_, i) => i + 1).join("\n");
            const color_map = {
                string: "#1f4ea3", comment: "#948f86", regex: "#1f4ea3", number: "#d0301c",
                name: "#16161a", keyword: "#16161a", punctuator: "#6f6b64", whitespace: "", invalid: ""
            };
            for (const t of new Code_Manager(code_string).tokens) {
                if (t.type === "name" && typeof this.definitions[t.value] === "function") {
                    const link = this.code_display.appendChild(Object.assign(document.createElement("a"), {textContent: t.value}));
                    link.addEventListener("click", () => this.display_code(this.definitions[t.value]));
                    continue;
                }
                const type = t.type === "name" && Code_Widget.keywords.has(t.value) ? "keyword" : t.type;
                const span = this.code_display.appendChild(Object.assign(document.createElement("span"), {textContent: t.value}));
                span.style.color = color_map[type];
                if (type === "keyword") span.style.fontWeight = "600";
                if (type === "comment") span.style.fontStyle = "italic";
            }
        }
    };

/**
 * **Text_Widget** — calls the first scene's show_explanation(element, webgl_manager) once.
 */
const Text_Widget = widgets.Text_Widget =
    class Text_Widget {
        constructor(element, scenes, webgl_manager) {
            inject_style();
            if (scenes[0]) scenes[0].show_explanation(element, webgl_manager);
        }
    };
