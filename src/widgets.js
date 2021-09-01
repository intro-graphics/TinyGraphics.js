/**
 * @file
 * This file defines a lot of panels that can be placed on websites to create interactive graphics programs that use tiny-graphics.js.
 */

// import {tiny} from './tiny-graphics.js';

// Pull these names into this module's scope for convenience.
// const {color, Scene} = tiny;
import * as tiny from "./TinyGraphics.js";
import {color} from "./TinyGraphics.js";
import {WebglManager} from "./utils.js";

export const widgets = {};

widgets.CanvasWidget =
    class CanvasWidget {
        // **CanvasWidget** embeds a WebGL demo onto a website in place of the given placeholder document
        // element.  It creates a WebGL canvas and loads onto it any initial Scene objects in the
        // arguments.  Optionally spawns a TextWidget and ControlsWidget for showing more information
        // or interactive UI buttons, divided into one panel per each loaded Scene.  You can use up to
        // 16 Canvas_Widgets; browsers support up to 16 WebGL contexts per page.
        constructor(element, initialScenes, options = {}) {
            this.element = element;

            const defaults = {
                show_canvas: true, make_controls: true, showExplanation: true,
                make_editor: false, make_code_nav: true,
            };
            if (initialScenes && initialScenes[0])
                Object.assign(options, initialScenes[0].widget_options);
            Object.assign(this, defaults, options)

            const rules = [".canvas-widget { width: 1080px; background: White; margin:auto }",
                ".canvas-widget canvas { width: 1080px; height: 600px; margin-bottom:-3px }"];

            if (document.styleSheets.length === 0) document.head.appendChild(document.createElement("style"));
            for (const r of rules) document.styleSheets[document.styleSheets.length - 1].insertRule(r, 0)

            // Fill in the document elements:
            if (this.showExplanation) {
                this.embedded_explanation_area = this.element.appendChild(document.createElement("div"));
                this.embedded_explanation_area.className = "text-widget";
            }

            const canvas = this.element.appendChild(document.createElement("canvas"));

            if (this.make_controls) {
                this.embedded_controls_area = this.element.appendChild(document.createElement("div"));
                this.embedded_controls_area.className = "controls-widget";
            }

            if (this.make_code_nav) {
                this.embedded_code_nav_area = this.element.appendChild(document.createElement("div"));
                this.embedded_code_nav_area.className = "code-widget";
            }

            if (this.make_editor) {
                this.embedded_editor_area = this.element.appendChild(document.createElement("div"));
                this.embedded_editor_area.className = "editor-widget";
            }

            if (!this.show_canvas)
                canvas.style.display = "none";

            this.webglManager = new WebglManager(canvas, color(0, 0, 0, 1));
            // Second parameter sets background color.


            // Add scenes and child widgets
            if (initialScenes)
                this.webglManager.scenes.push(...initialScenes);

            const primaryScene = initialScenes ? initialScenes[0] : undefined;
            const additionalScenes = initialScenes ? initialScenes.slice(1) : [];
            const primarySceneDefinition = primaryScene ? primaryScene.constructor : undefined;
            if (this.showExplanation)
                this.embedded_explanation = new TextWidget(this.embedded_explanation_area, this.webglManager.scenes, this.webglManager);
            if (this.make_controls)
                this.embedded_controls = new ControlsWidget(this.embedded_controls_area, this.webglManager.scenes);
            if (this.make_editor)
                this.embedded_editor = new EditorWidget(this.embedded_editor_area, primarySceneDefinition, this);
            if (this.make_code_nav)
                this.embedded_code_nav = new CodeWidget(this.embedded_code_nav_area, primarySceneDefinition,
                    additionalScenes, {associated_editor: this.embedded_editor});

            // Start WebGL initialization.  Note that render() will re-queue itself for continuous calls.
            this.webglManager.render();
        }
    }


const ControlsWidget = widgets.ControlsWidget =
    class ControlsWidget {
        // **ControlsWidget** adds an array of panels to the document, one per loaded
        // Scene object, each providing interactive elements such as buttons with key
        // bindings, live readouts of Scene data members, etc.
        constructor(element, scenes) {
            const rules = [".controls-widget * { font-family: monospace }",
                ".controls-widget div { background: White }",
                ".controls-widget table { border-collapse: collapse; display:block; overflow-x: auto; table-layout: fixed;}",
                ".controls-widget table.control-box { width: 1080px; border:1px; margin:0; max-height:380px; " +
                "transition:.5s; overflow-y:scroll; background:white }",
                ".controls-widget table.control-box:hover { max-height:500px }",
                ".controls-widget table.control-box td { overflow:hidden; border:1px; background:Black; border-radius:10px; width: 540px;}",
                ".controls-widget table.control-box td .control-div { background: White; height:338px; padding: 5px 5px 5px 30px; }",
                ".controls-widget table.control-box td * { background:transparent }",
                ".controls-widget table.control-box .control-div td { border-radius:unset }",
                ".controls-widget table.control-box .control-title { padding:7px 40px; color:white; background:#252424;}",
                ".controls-widget *.liveString { display:inline-block; background:unset }",
                ".dropdown { display:inline-block }",
                ".dropdown-content { display:inline-block; transition:.2s; transform: scaleY(0); overflow:hidden; position: absolute; \
                                      z-index: 1; background:#E8F6FF; padding: 16px; margin-left:30px; min-width: 100px; \
                                      border-radius:10px }",
                ".dropdown-content a { color: black; padding: 4px 4px; display: block }",
                ".dropdown a:hover { background: #f1f1f1 }",
                ".controls-widget button { background: #303030; color: white; padding: 3px; border-radius:5px; \
                                           transition: background .3s, transform .3s }",
                ".controls-widget button:hover, button:focus { transform: scale(1.1); color:#FFFFFF }",
                ".link { text-decoration:underline; cursor: pointer }",
                ".show { transform: scaleY(1); height:200px; overflow:auto }",
                ".hide { transform: scaleY(0); height:0px; overflow:hidden  }"];

            const style = document.head.appendChild(document.createElement("style"));
            for (const r of rules) document.styleSheets[document.styleSheets.length - 1].insertRule(r, 0)

            const table = element.appendChild(document.createElement("table"));
            table.className = "control-box";
            this.row = table.insertRow(0);

            this.panels = [];
            this.scenes = scenes;

            this.render();
        }

        makePanels(time) {
            this.timestamp = time;
            this.row.innerHTML = "";
            // Traverse all scenes and their children, recursively:
            const openList = [...this.scenes];
            while (openList.length) {
                openList.push(...openList[0].children);
                const scene = openList.shift();

                const controlBox = this.row.insertCell();
                this.panels.push(controlBox);
                // Draw top label bar:
                controlBox.appendChild(Object.assign(document.createElement("div"), {
                    textContent: scene.constructor.name, className: "control-title",
                }));

                const controlPanel = controlBox.appendChild(document.createElement("div"));
                controlPanel.className = "control-div";
                scene.controlPanel = controlPanel;
                scene.timestamp = time;
                // Draw each registered animation:
                scene.makeControlPanel();
            }
        }

        render(time = 0) {
            // Check to see if we need to re-create the panels due to any scene being new.
            // Traverse all scenes and their children, recursively:
            const openList = [...this.scenes];
            while (openList.length) {
                openList.push(...openList[0].children);
                const scene = openList.shift();
                if (!scene.timestamp || scene.timestamp > this.timestamp) {
                    this.makePanels(time);
                    break;
                }

                // TODO: Check for updates to each scene's desired_controls_position, including if the
                // scene just appeared in the tree, in which case call makeControlPanel().
            }

            for (let panel of this.panels)
                for (let liveString of panel.querySelectorAll(".liveString")) liveString.onload(liveString);
            // TODO: Cap this so that it can't be called faster than a human can read?
            this.event = window.requestAnimFrame(this.render.bind(this));
        }
    }


const CodeManager = widgets.CodeManager =
    class CodeManager {
        // **CodeManager** breaks up a string containing code (any ES6 JavaScript).  The RegEx being used
        // to parse is from https://github.com/lydell/js-tokens which states the following limitation:
        // "If the end of a statement looks like a regex literal (even if it isn’t), it will be treated
        // as one."  (This can miscolor lines of code containing divisions and comments).
        constructor(code) {
            const esSixTokensParser = RegExp([
                /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!{)|\${(?:[^{}]|{[^}]*}?)*}?)*(`)?)/,    // Any string.
                /(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)/,                                                                           // Any comment (2 forms).  And next, any regex:
                /(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))/,
                /(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)/,                                     // Any number.
                /((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u{[\da-fA-F]+})+)/,                                          // Any name.
                /(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])/,                      // Any punctuator.
                /(\s+)|(^$|[\s\S])/                                                                                                   // Any whitespace. Lastly, blank/invalid.
            ].map(r => r.source).join('|'), 'g');

            this.tokens = [];
            this.no_comments = [];
            let singleToken = null;
            while ((singleToken = esSixTokensParser.exec(code)) !== null) {
                let token = {type: "invalid", value: singleToken[0]}
                if (singleToken[1]) {
                    token.type = "string";
                    token.closed = !!(singleToken[3] || singleToken[4]);
                } else if (singleToken[5]) token.type = "comment"
                else if (singleToken[6]) {
                    token.type = "comment";
                    token.closed = !!singleToken[7];
                } else if (singleToken[8]) token.type = "regex"
                else if (singleToken[9]) token.type = "number"
                else if (singleToken[10]) token.type = "name"
                else if (singleToken[11]) token.type = "punctuator"
                else if (singleToken[12]) token.type = "whitespace"
                this.tokens.push(token)
                if (token.type !== "whitespace" && token.type !== "comment") this.no_comments.push(token.value);
            }
        }
    }


const CodeWidget = widgets.CodeWidget =
    class CodeWidget {
        // **CodeWidget** draws a code navigator panel with inline links to the entire program source code.
        constructor(element, mainScene, additionalScenes, options = {}) {
            // TODO: Update color and board here
            const rules = [".code-widget .code-panel { margin:auto; background:white; overflow:auto; font-family:monospace; \
                width:1058px; padding:10px; padding-bottom:40px; max-height: 500px; \
                border-radius:10px; border: 1px solid black; }",
                ".code-widget .code-display { min-width:1200px; padding:10px; white-space:pre-wrap; background:transparent }",
                ".code-widget table { display:block; margin:auto; overflow-x:auto; width:1080px; border-radius:10px; " +
                "border-collapse:collapse; border: 1px solid black }",
                ".code-widget table.class-list td { border-width:thin; background: White; padding:10px; " +
                "font-family:monospace; border: 1px solid black }"
            ];

            if (document.styleSheets.length === 0)
                document.head.appendChild(document.createElement("style"));
            for (const r of rules)
                document.styleSheets[document.styleSheets.length - 1].insertRule(r, 0)

            this.associated_editor_widget = options.associated_editor;

            if (!mainScene)
                return;

            import( '../main-scene.js' )
                .then(module => {
                    this.buildReader(element, mainScene, additionalScenes, module);
                    if (!options.hide_navigator)
                        this.buildNavigator(element, mainScene, additionalScenes, module);
                })
        }

        buildReader(element, mainScene, additionalScenes, definitions) {
            // (Internal helper function)
            this.definitions = definitions;
            const codePanel = element.appendChild(document.createElement("div"));
            codePanel.className = "code-panel";
            // const text        = codePanel.appendChild( document.createElement( "p" ) );
            // text.textContent  = "Code for the above scene:";
            this.code_display = codePanel.appendChild(document.createElement("div"));
            this.code_display.className = "code-display";
            // Default textbox contents:
            this.displayCode(mainScene);
        }

        buildNavigator(element, mainScene, additionalScenes, definitions) {
            // (Internal helper function)
            const classList = element.appendChild(document.createElement("table"));
            classList.className = "class-list";
            const topCell = classList.insertRow(-1).insertCell(-1);
            topCell.colSpan = 2;
            topCell.appendChild(document.createTextNode("Click below to navigate through all classes that are defined."));
            const content = topCell.appendChild(document.createElement("p"));
            content.style = "text-align:center; margin:0; font-weight:bold";
            content.innerHTML = "main-scene.js<br>Main Scene: ";
            const mainSceneLink = content.appendChild(document.createElement("a"));
            mainSceneLink.href = "javascript:void(0);"
            mainSceneLink.addEventListener('click', () => this.displayCode(mainScene));
            mainSceneLink.textContent = mainScene.name;

            const secondCell = classList.insertRow(-1).insertCell(-1);
            secondCell.colSpan = 2;
            secondCell.style = "text-align:center; font-weight:bold";
            const indexSrcLink = secondCell.appendChild(document.createElement("a"));
            indexSrcLink.href = "javascript:void(0);"
            indexSrcLink.addEventListener('click', () => this.displayCode());
            indexSrcLink.textContent = "This page's complete HTML source";

            const thirdRow = classList.insertRow(-1);
            thirdRow.style = "text-align:center";
            thirdRow.innerHTML = "<td><b>TinyGraphics.js</b><br>(Always the same)</td> \
                             <td><b>All other class definitions from dependencies:</td>";

            const fourthRow = classList.insertRow(-1);
            // Generate the navigator table of links:
            for (let list of [tiny, definitions]) {
                const cell = fourthRow.appendChild(document.createElement("td"));
                // List all class names except the main one, which we'll display separately:
                const classNames = Object.keys(list).filter(x => x !== mainScene.name);
                cell.style = "white-space:normal";
                for (let name of classNames) {
                    const classLink = cell.appendChild(document.createElement("a"));
                    classLink.style["margin-right"] = "80px";
                    classLink.href = "javascript:void(0);";
                    classLink.addEventListener('click', () => this.displayCode(tiny[name] || definitions[name]));
                    classLink.textContent = name;
                    cell.appendChild(document.createTextNode(" "));
                }
            }
        }

        displayCode(classToDisplay) {
            // displayCode():  Populate the code textbox.
            // Pass undefined to choose index.html source.
            if (this.associated_editor_widget)
                this.associated_editor_widget.selectClass(classToDisplay);
            if (classToDisplay) this.formatCode(classToDisplay.toString());
            else fetch(document.location.href)
                .then(response => response.text())
                .then(pageSource => this.formatCode(pageSource));
        }

        formatCode(codeString) {
            // (Internal helper function)
            this.code_display.innerHTML = "";
            const colorMap = {
                string: "chocolate", comment: "green", regex: "blue", number: "magenta",
                name: "black", punctuator: "red", whitespace: "black"
            };

            for (let t of new CodeManager(codeString).tokens)
                if (t.type === "name" && [...Object.keys(tiny), ...Object.keys(this.definitions)].includes(t.value)) {
                    const link = this.code_display.appendChild(document.createElement('a'));
                    link.href = "javascript:void(0);"
                    link.addEventListener('click', () => this.displayCode(tiny[t.value] || this.definitions[t.value]));
                    link.textContent = t.value;
                } else {
                    const span = this.code_display.appendChild(document.createElement('span'));
                    span.style.color = colorMap[t.type];
                    span.textContent = t.value;
                }
        }
    }


const EditorWidget = widgets.EditorWidget =
    class EditorWidget {
        constructor(element, initiallySelectedClass, canvasWidget, options = {}) {
            let rules = [".editor-widget { margin:auto; background:white; overflow:auto; font-family:monospace; width:1060px; padding:10px; \
                                      border-radius:10px; box-shadow: 20px 20px 90px 0px powderblue inset, 5px 5px 30px 0px blue inset }",
                ".editor-widget button { background: #4C9F50; color: white; padding: 6px; border-radius:10px; margin-right:5px; \
                                         box-shadow: 4px 6px 16px 0px rgba(0,0,0,0.3); transition: background .3s, transform .3s }",
                ".editor-widget input { margin-right:5px }",
                ".editor-widget textarea { white-space:pre; width:1040px; margin-bottom:30px }",
                ".editor-widget button:hover, button:focus { transform: scale(1.3); color:#252424 }"
            ];

            for (const r of rules) document.styleSheets[0].insertRule(r, 1);

            this.associated_canvas = canvasWidget;
            this.options = options;

            const form = this.form = element.appendChild(document.createElement("form"));
            // Don't refresh the page on submit:
            form.addEventListener('submit', event => {
                event.preventDefault();
                this.submitDemo()
            }, false);

            const explanation = form.appendChild(document.createElement("p"));
            explanation.innerHTML = `<i><b>What can I put here?</b></i>  
                A JavaScript class, with any valid JavaScript inside.  Your code can use classes from this demo,
                <br>or from ANY demo on Demopedia --  the dependencies will automatically be pulled in to run your demo!<br>`;

            const runButton = this.runButton = form.appendChild(document.createElement("button"));
            runButton.type = "button";
            runButton.style = "background:maroon";
            runButton.textContent = "Run with Changes";

            const submit = this.submit = form.appendChild(document.createElement("button"));
            submit.type = "submit";
            submit.textContent = "Save as New Webpage";

            const authorBox = this.authorBox = form.appendChild(document.createElement("input"));
            authorBox.name = "author";
            authorBox.type = "text";
            authorBox.placeholder = "Author name";

            const passwordBox = this.passwordBox = form.appendChild(document.createElement("input"));
            passwordBox.name = "password";
            passwordBox.type = "text";
            passwordBox.placeholder = "Password";
            passwordBox.style = "display:none";

            const overwritePanel = this.overwritePanel = form.appendChild(document.createElement("span"));
            overwritePanel.style = "display:none";
            overwritePanel.innerHTML = "<label>Overwrite?<input type='checkbox' name='overwrite' autocomplete='off'></label>";

            const submitResult = this.submitResult = form.appendChild(document.createElement("div"));
            submitResult.style = "margin: 10px 0";

            const newDemoCode = this.newDemoCode = form.appendChild(document.createElement("textarea"));
            newDemoCode.name = "newDemoCode";
            newDemoCode.rows = this.options.rows || 25;
            newDemoCode.cols = 140;
            if (initiallySelectedClass)
                this.selectClass(initiallySelectedClass);
        }

        selectClass(classDefinition) {
            this.newDemoCode.value = classDefinition.toString();
        }

        fetchHandler(url, body) {
            // A general utility function for sending / receiving JSON, with error handling.
            return fetch(url,
                {
                    body: body, method: body === undefined ? 'GET' : 'POST',
                    headers: {'content-type': 'application/json'}
                }).then(response => {
                if (response.ok) return Promise.resolve(response.json())
                else return Promise.reject(response.status)
            })
        }

        submitDemo() {
            const form_fields = Array.from(this.form.elements).reduce((accum, elem) => {
                if (elem.value && !(['checkbox', 'radio'].includes(elem.type) && !elem.checked))
                    accum[elem.name] = elem.value;
                return accum;
            }, {});

            this.submitResult.innerHTML = "";
            return this.fetchHandler("/submit-demo?Unapproved", JSON.stringify(form_fields))
                .then(response => {
                    if (response.show_password) this.passwordBox.style.display = "inline";
                    if (response.show_overwrite) this.overwritePanel.style.display = "inline";
                    this.submitResult.innerHTML += response.message + "<br>";
                })
                .catch(error => {
                    this.submitResult.innerHTML += "Error " + error + " when trying to upload.<br>"
                })
        }
    }


const TextWidget = widgets.TextWidget =
    class TextWidget {
        // **TextWidget** generates HTML documentation and fills a panel with it.  This
        // documentation is extracted from whichever Scene object gets loaded first.
        constructor(element, scenes, webglManager) {
            const rules = [".text-widget { background: white; width:1060px;\
                             padding:0 10px; overflow:auto; transition:1s; \
                             overflow-y:scroll; box-shadow: 10px 10px 90px 0 inset LightGray}",
                ".text-widget div { transition:none } "
            ];
            if (document.styleSheets.length === 0) document.head.appendChild(document.createElement("style"));
            for (const r of rules) document.styleSheets[document.styleSheets.length - 1].insertRule(r, 0)

            Object.assign(this, {element, scenes, webglManager});
            this.render();
        }

        render(time = 0) {
            if (this.scenes[0])
                this.scenes[0].showExplanation(this.element, this.webglManager);
            else
                this.event = window.requestAnimFrame(this.render.bind(this))
        }
    }