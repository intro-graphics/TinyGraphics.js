/**
 * @file tiny-graphics-widgets.js — page panels around a TinyGraphics.js canvas:
 * the canvas itself, per-scene control panels, an explanation area, and a code viewer.
 */

import {tiny} from './tiny-graphics.js';

const {color} = tiny;

export const widgets = {};

// All widget styling lives here, injected once.  Layout is fluid: the widget fills its container
// up to --tg-max-width, so it works on laptops and phones alike.
const STYLE = `
.tg-widget { --tg-max-width: 1080px; max-width: var(--tg-max-width); margin: 0 auto; font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1d1d1f; }
.tg-widget canvas { display: block; width: 100%; background: #000; border-radius: 6px 6px 0 0; touch-action: none; }
.tg-canvas-wrap { position: relative; }
.tg-error { position: absolute; inset: 0; margin: 0; padding: 16px; overflow: auto; background: rgba(40, 8, 8, .92); color: #ffd9d4;
  font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; border-radius: 6px 6px 0 0; }
.tg-error b { color: #fff; }
.tg-explanation { padding: 4px 2px 10px; }
.tg-explanation:empty { display: none; }
.tg-controls { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px; background: #f3f3f0; border-radius: 0 0 6px 6px; }
.tg-panel { flex: 1 1 300px; background: #fff; border: 1px solid #e0e0da; border-radius: 6px; padding: 0 10px 10px; min-width: 0; }
.tg-panel-title { margin: 0 -10px 8px; padding: 5px 10px; background: #2a2a2c; color: #fff; border-radius: 6px 6px 0 0; font-size: 12px; letter-spacing: .02em; }
.tg-panel button { margin: 2px 2px; padding: 4px 8px; border: 0; border-radius: 4px; color: #fff; font: inherit; font-size: 13px; cursor: pointer;
  transition: transform .12s, filter .12s; }
.tg-panel button:hover { filter: brightness(1.15); }
.tg-panel button.pressed { transform: scale(1.08); filter: brightness(1.3); }
.tg-panel .live_string { display: inline-block; font-variant-numeric: tabular-nums; }
.tg-panel label.slider { display: flex; flex-direction: column; margin: 4px 0; font-size: 13px; }
.tg-panel label.slider input { width: 100%; }
.tg-code { margin-top: 12px; }
.tg-code-panel { max-height: 480px; overflow: auto; background: #fff; border: 1px solid #e0e0da; border-radius: 6px; padding: 10px;
  font: 12.5px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre; }
.tg-code-panel a { color: #2f6fdd; cursor: pointer; text-decoration: underline; }
.tg-class-list { margin-top: 8px; font-size: 12.5px; line-height: 1.9; }
.tg-class-list a { color: #2f6fdd; cursor: pointer; margin-right: 14px; white-space: nowrap; }
`;

function inject_style() {
    if (document.getElementById("tg-style")) return;
    document.head.appendChild(Object.assign(document.createElement("style"), {id: "tg-style", textContent: STYLE}));
}

/**
 * **Canvas_Widget** — puts a WebGL canvas (and optional panels) inside `element` and starts
 * drawing `scenes` on it.
 *   new Canvas_Widget(element, [new My_Scene()], {aspect: 16 / 9, make_controls: true,
 *                     show_explanation: true, make_code_nav: false, background: color(0,0,0,1)})
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
                aspect: 16 / 9, background: color(0, 0, 0, 1), definitions: undefined
            };
            Object.assign(this, defaults, options, (initial_scenes[0] && initial_scenes[0].widget_options) || {});

            if (this.show_explanation)
                this.embedded_explanation_area = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-explanation"}));

            const wrap = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-canvas-wrap"}));
            const canvas = wrap.appendChild(document.createElement("canvas"));
            canvas.style.aspectRatio = String(this.aspect);
            if (!this.show_canvas) wrap.style.display = "none";

            if (this.make_controls)
                this.embedded_controls_area = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-controls"}));
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
 * **Code_Widget** — shows the source of a class, with every known class name clickable.
 *   new Code_Widget(element, Some_Class, {definitions: defs, hide_navigator: false})
 */
const Code_Widget = widgets.Code_Widget =
    class Code_Widget {
        constructor(element, class_to_show, {definitions = {}, hide_navigator = false} = {}) {
            inject_style();
            this.definitions = {...tiny, ...definitions};
            this.code_display = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-code-panel"}));
            if (!hide_navigator) {
                const list = element.appendChild(Object.assign(document.createElement("div"), {className: "tg-class-list"}));
                list.append("Browse the source of every class: ");
                for (const name of Object.keys(this.definitions).filter(n => typeof this.definitions[n] === "function")) {
                    const link = list.appendChild(Object.assign(document.createElement("a"), {textContent: name}));
                    link.addEventListener("click", () => this.display_code(this.definitions[name]));
                    list.append(" ");
                }
            }
            if (class_to_show) this.display_code(class_to_show);
        }

        display_code(class_to_display) {
            this.format_code(class_to_display.toString());
        }

        format_code(code_string) {
            this.code_display.innerHTML = "";
            const color_map = {
                string: "#b35c00", comment: "#3a7d44", regex: "#2f6fdd", number: "#a0309a",
                name: "#1d1d1f", punctuator: "#b8322a", whitespace: "#1d1d1f", invalid: "#1d1d1f"
            };
            for (const t of new Code_Manager(code_string).tokens) {
                if (t.type === "name" && typeof this.definitions[t.value] === "function") {
                    const link = this.code_display.appendChild(Object.assign(document.createElement("a"), {textContent: t.value}));
                    link.addEventListener("click", () => this.display_code(this.definitions[t.value]));
                } else {
                    const span = this.code_display.appendChild(Object.assign(document.createElement("span"), {textContent: t.value}));
                    span.style.color = color_map[t.type];
                }
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
