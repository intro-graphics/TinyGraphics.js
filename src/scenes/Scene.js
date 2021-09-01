import {KeyboardManager} from "../activities/KeyboardManager.js";
import {Mat4} from "../math/Matrix.js";
import {vec, vec3, vec4} from "../TinyGraphics.js";

/**
 * **Scene** is the base class for any scene part or code snippet that you can add to a
 * canvas.  Make your own subclass(es) of this and override their methods "display()"
 * and "makeControlPanel()" to make them draw to a canvas, or generate custom control
 * buttons and readouts, respectively.  Scenes exist in a hierarchy; their child Scenes
 * can either contribute more drawn shapes or provide some additional tool to the end
 * user via drawing additional control panel buttons or live text readouts.
 */
class Scene {
    controlPanel;

    constructor() {
        this.children = [];
        // Set up how we'll handle key presses for the scene's control panel:
        const callbackBehavior = (callback, event) => {
            callback(event);
            // Fire the callback and cancel any default browser shortcut that is an exact match.
            event.preventDefault();
            // Don't bubble the event to parent nodes; let child elements be targeted in isolation.
            event.stopPropagation();
        };
        this.keyControls = new KeyboardManager(document, callbackBehavior);
    }

    /**
     * Formats a scene's control panel with a new line break.
     * @param parent
     */
    newLine(parent = this.controlPanel) {
        parent.appendChild(document.createElement("br"));
    }

    /**
     * Create an element somewhere in the control panel that
     * does reporting of the scene's values in real time.  The event loop
     * will constantly update all HTML elements made this way.
     * @param callback
     * @param parent
     */
    liveString(callback, parent = this.controlPanel) {
        parent.appendChild(Object.assign(document.createElement("div"), {
            className: "liveString",
            onload: callback,
        }));
    }

    /**
     * Trigger any scene behavior by assigning
     * a key shortcut and a labelled HTML button to fire any callback
     * function/method of a Scene.  Optional release callback as well.
     * @param description
     * @param shortcutCombination
     * @param callback
     * @param color
     * @param releaseEvent
     * @param recipient
     * @param parent
     */
    keyTriggeredButton(description, shortcutCombination, callback, color = '#6E6460',
                       releaseEvent, recipient = this, parent = this.controlPanel) {
        const button = parent.appendChild(document.createElement("button"));
        button.defaultColor = button.style.backgroundColor = color;
        const press = () => {
                Object.assign(button.style, {
                    'background-color': color,
                    'z-index': "1", 'transform': "scale(1.5)",
                });
                callback.call(recipient);
            },
            release = () => {
                Object.assign(button.style, {
                    'background-color': button.defaultColor,
                    'z-index': "0", 'transform': "scale(1)",
                });
                if (!releaseEvent) return;
                releaseEvent.call(recipient);
            };
        const keyName = shortcutCombination.join('+').split(" ").join("Space");
        button.textContent = "(" + keyName + ") " + description;
        button.addEventListener("mousedown", press);
        button.addEventListener("mouseup", release);
        button.addEventListener("touchstart", press, {passive: true});
        button.addEventListener("touchend", release, {passive: true});
        if (!shortcutCombination) return;
        this.keyControls.add(shortcutCombination, press, release);
    }

    // To use class Scene, override at least one of the below functions,
    // which will be automatically called by other classes
    /**
     * Called by WebglManager for drawing.
     * @param context
     * @param programState
     */
    display(context, programState) {
    }

    /**
     * Called by ControlsWidget for generating interactive UI.
     */
    makeControlPanel() {
    }

    /**
     * Called by TextWidget for generating documentation.
     * @param documentSection
     */
    showExplanation(documentSection) {
    }
}


/**
 * **MovementControls** is a Scene that can be attached to a canvas, like any other
 * Scene, but it is a Secondary Scene Component -- meant to stack alongside other
 * scenes.  Rather than drawing anything it embeds both first-person and third-
 * person style controls into the website.  These can be used to manually move your
 * camera or other objects smoothly through your scene using key, mouse, and HTML
 * button controls to help you explore what's in it.
 */
class MovementControls extends Scene {
    constructor() {
        super();
        const dataMembers = {
            roll: 0, lookAroundLocked: true,
            thrust: vec3(0, 0, 0), pos: vec3(0, 0, 0), zAxis: vec3(0, 0, 0),
            radiansPerFrame: 1 / 200, metersPerFrame: 20, speedMultiplier: 1,
        };
        Object.assign(this, dataMembers);

        this.mouseEnabledCanvases = new Set();
        this.willTakeOverGraphicsState = true;
    }

    setRecipient(matrixClosure, inverseClosure) {
        // setRecipient(): The camera matrix is not actually stored here inside Movement_Controls;
        // instead, track an external target matrix to modify.  Targets must be pointer references
        // made using closures.
        this.matrix = matrixClosure;
        this.inverse = inverseClosure;
    }

    reset(graphicsState) {
        // reset(): Initially, the default target is the camera matrix that Shaders use, stored in the
        // encountered programState object.  Targets must be pointer references made using closures.
        this.setRecipient(() => graphicsState.cameraTransform,
            () => graphicsState.camera_inverse);
    }

    addMouseControls(canvas) {
        // addMouseControls():  Attach HTML mouse events to the drawing canvas.
        // First, measure mouse steering, for rotating the flyaround camera:
        this.mouse = {"from_center": vec(0, 0)};
        const mousePosition = (e, rect = canvas.getBoundingClientRect()) =>
            vec(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas:
        document.addEventListener("mouseup", _ => {
            this.mouse.anchor = undefined;
        });
        canvas.addEventListener("mousedown", e => {
            e.preventDefault();
            this.mouse.anchor = mousePosition(e);
        });
        canvas.addEventListener("mousemove", e => {
            e.preventDefault();
            this.mouse.from_center = mousePosition(e);
        });
        canvas.addEventListener("mouseout", _ => {
            if (!this.mouse.anchor) this.mouse.from_center.scale_by(0);
        });
    }

    showExplanation(documentElement) {
    }

    makeControlPanel() {
        // makeControlPanel(): Sets up a panel of interactive HTML elements, including
        // buttons with key bindings for affecting this scene, and live info readouts.
        this.controlPanel.innerHTML += "Click and drag the scene to spin your viewpoint around it.<br>";
        this.liveString(box => box.textContent = "- Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2)
            + ", " + this.pos[2].toFixed(2));
        this.newLine();
        // The facing directions are surprisingly affected by the left hand rule:
        this.liveString(box => box.textContent = "- Facing: " + ((this.zAxis[0] > 0 ? "West " : "East ")
            + (this.zAxis[1] > 0 ? "Down " : "Up ") + (this.zAxis[2] > 0 ? "North" : "South")));
        this.newLine();
        this.newLine();

        this.keyTriggeredButton("Up", [" "], () => this.thrust[1] = -1, undefined, () => this.thrust[1] = 0);
        this.keyTriggeredButton("Forward", ["w"], () => this.thrust[2] = 1, undefined, () => this.thrust[2] = 0);
        this.newLine();
        this.keyTriggeredButton("Left", ["a"], () => this.thrust[0] = 1, undefined, () => this.thrust[0] = 0);
        this.keyTriggeredButton("Back", ["s"], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0);
        this.keyTriggeredButton("Right", ["d"], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0);
        this.newLine();
        this.keyTriggeredButton("Down", ["z"], () => this.thrust[1] = 1, undefined, () => this.thrust[1] = 0);

        const speedControls = this.controlPanel.appendChild(document.createElement("span"));
        speedControls.style.margin = "30px";
        this.keyTriggeredButton("-", ["o"], () =>
            this.speedMultiplier /= 1.2, undefined, undefined, undefined, speedControls);
        this.liveString(box => {
            box.textContent = "Speed: " + this.speedMultiplier.toFixed(2);
        }, speedControls);
        this.keyTriggeredButton("+", ["p"], () =>
            this.speedMultiplier *= 1.2, undefined, undefined, undefined, speedControls);
        this.newLine();
        this.keyTriggeredButton("Roll left", [","], () => this.roll = 1, undefined, () => this.roll = 0);
        this.keyTriggeredButton("Roll right", ["."], () => this.roll = -1, undefined, () => this.roll = 0);
        this.newLine();
        this.keyTriggeredButton("(Un)freeze mouse look around", ["f"], () => this.lookAroundLocked ^= 1, "#8B8885");
        this.newLine();
        this.keyTriggeredButton("Go to world origin", ["r"], () => {
            this.matrix().set_identity(4, 4);
            this.inverse().set_identity(4, 4);
        }, "#8B8885");
        this.newLine();

        this.keyTriggeredButton("Look at origin from front", ["1"], () => {
            this.inverse().set(Mat4.look_at(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.matrix().set(Mat4.inverse(this.inverse()));
        }, "#8B8885");
        this.newLine();
        this.keyTriggeredButton("from right", ["2"], () => {
            this.inverse().set(Mat4.look_at(vec3(10, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.matrix().set(Mat4.inverse(this.inverse()));
        }, "#8B8885");
        this.keyTriggeredButton("from rear", ["3"], () => {
            this.inverse().set(Mat4.look_at(vec3(0, 0, -10), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.matrix().set(Mat4.inverse(this.inverse()));
        }, "#8B8885");
        this.keyTriggeredButton("from left", ["4"], () => {
            this.inverse().set(Mat4.look_at(vec3(-10, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.matrix().set(Mat4.inverse(this.inverse()));
        }, "#8B8885");
        this.newLine();
        this.keyTriggeredButton("Attach to global camera", ["Shift", "R"],
            () => {
                this.willTakeOverGraphicsState = true;
            }, "#8B8885");
        this.newLine();
    }

    firstPersonFlyAround(radiansPerFrame, metersPerFrame, leeway = 70) {
        // (Internal helper function)
        // Compare mouse's location to all four corners of a dead box:
        const offsetsFromDeadBox = {
            plus: [this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway],
            minus: [this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway],
        };
        // Apply a camera rotation movement, but only when the mouse is
        // past a minimum distance (leeway) from the canvas's center:
        if (!this.lookAroundLocked)
            // If steering, steer according to "mouse_from_center" vector, but don't
            // start increasing until outside a leeway window from the center.
            for (let i = 0; i < 2; i++) {                                     // The &&'s in the next line might zero the vectors out:
                let o = offsetsFromDeadBox,
                    velocity = ((o.minus[i] > 0 && o.minus[i]) || (o.plus[i] < 0 && o.plus[i])) * radiansPerFrame;
                // On X step, rotate around Y axis, and vice versa.
                this.matrix().postMultiply(Mat4.rotation(-velocity, i, 1 - i, 0));
                this.inverse().pre_multiply(Mat4.rotation(+velocity, i, 1 - i, 0));
            }
        this.matrix().postMultiply(Mat4.rotation(-.1 * this.roll, 0, 0, 1));
        this.inverse().pre_multiply(Mat4.rotation(+.1 * this.roll, 0, 0, 1));
        // Now apply translation movement of the camera, in the newest local coordinate frame.
        this.matrix().postMultiply(Mat4.translation(...this.thrust.times(-metersPerFrame)));
        this.inverse().pre_multiply(Mat4.translation(...this.thrust.times(+metersPerFrame)));
    }

    thirdPersonArcball(radiansPerFrame) {
        // (Internal helper function)
        // Spin the scene around a point on an axis determined by user mouse drag:
        const draggingVector = this.mouse.from_center.minus(this.mouse.anchor);
        if (draggingVector.norm() <= 0)
            return;
        this.matrix().postMultiply(Mat4.translation(0, 0, -25));
        this.inverse().pre_multiply(Mat4.translation(0, 0, +25));

        const rotation = Mat4.rotation(radiansPerFrame * draggingVector.norm(),
            draggingVector[1], draggingVector[0], 0);
        this.matrix().postMultiply(rotation);
        this.inverse().pre_multiply(rotation);

        this.matrix().postMultiply(Mat4.translation(0, 0, +25));
        this.inverse().pre_multiply(Mat4.translation(0, 0, -25));
    }

    display(context, graphicsState, dt = graphicsState.animationDeltaTime / 1000) {
        // The whole process of acting upon controls begins here.
        const m = this.speedMultiplier * this.metersPerFrame,
            r = this.speedMultiplier * this.radiansPerFrame;

        if (this.willTakeOverGraphicsState) {
            this.reset(graphicsState);
            this.willTakeOverGraphicsState = false;
        }

        if (!this.mouseEnabledCanvases.has(context.canvas)) {
            this.addMouseControls(context.canvas);
            this.mouseEnabledCanvases.add(context.canvas);
        }
        // Move in first-person.  Scale the normal camera aiming speed by dt for smoothness:
        this.firstPersonFlyAround(dt * r, dt * m);
        // Also apply third-person "arcball" camera mode if a mouse drag is occurring:
        if (this.mouse.anchor)
            this.thirdPersonArcball(dt * r);
        // Log some values:
        this.pos = this.inverse().times(vec4(0, 0, 0, 1));
        this.zAxis = this.inverse().times(vec4(0, 0, 1, 0));
    }
}

class ProgramStateViewer extends Scene {
    // **programStateViewer** just toggles, monitors, and reports some
    // global values via its control panel.
    makeControlPanel() {
        // display() of this scene will replace the following object:
        this.programState = {};
        this.keyTriggeredButton("(Un)pause animation", ["Alt", "a"], () => this.programState.animate ^= 1);
    }

    display(context, programState) {
        this.programState = programState;
    }
}

export {Scene, MovementControls, ProgramStateViewer};