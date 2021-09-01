import {Keyboard_Manager} from "../activities/Keyboard_Manager.js";
import {Mat4} from "../math/Matrix.js";
import {vec, vec3, vec4} from "../TinyGraphics.js";

/**
 * **Scene** is the base class for any scene part or code snippet that you can add to a
 * canvas.  Make your own subclass(es) of this and override their methods "display()"
 * and "make_control_panel()" to make them draw to a canvas, or generate custom control
 * buttons and readouts, respectively.  Scenes exist in a hierarchy; their child Scenes
 * can either contribute more drawn shapes or provide some additional tool to the end
 * user via drawing additional control panel buttons or live text readouts.
 */
class Scene {
    control_panel;

    constructor() {
        this.children = [];
        // Set up how we'll handle key presses for the scene's control panel:
        const callback_behavior = (callback, event) => {
            callback(event);
            // Fire the callback and cancel any default browser shortcut that is an exact match.
            event.preventDefault();
            // Don't bubble the event to parent nodes; let child elements be targeted in isolation.
            event.stopPropagation();
        }
        this.key_controls = new Keyboard_Manager(document, callback_behavior);
    }

    /**
     * Formats a scene's control panel with a new line break.
     * @param parent
     */
    new_line(parent = this.control_panel) {
        parent.appendChild(document.createElement("br"))
    }

    /**
     * Create an element somewhere in the control panel that
     * does reporting of the scene's values in real time.  The event loop
     * will constantly update all HTML elements made this way.
     * @param callback
     * @param parent
     */
    live_string(callback, parent = this.control_panel) {
        parent.appendChild(Object.assign(document.createElement("div"), {
            className: "live_string",
            onload: callback
        }));
    }

    /**
     * Trigger any scene behavior by assigning
     * a key shortcut and a labelled HTML button to fire any callback
     * function/method of a Scene.  Optional release callback as well.
     * @param description
     * @param shortcut_combination
     * @param callback
     * @param color
     * @param release_event
     * @param recipient
     * @param parent
     */
    key_triggered_button(description, shortcut_combination, callback, color = '#6E6460',
                         release_event, recipient = this, parent = this.control_panel) {
        const button = parent.appendChild(document.createElement("button"));
        button.default_color = button.style.backgroundColor = color;
        const press = () => {
                Object.assign(button.style, {
                    'background-color': color,
                    'z-index': "1", 'transform': "scale(1.5)"
                });
                callback.call(recipient);
            },
            release = () => {
                Object.assign(button.style, {
                    'background-color': button.default_color,
                    'z-index': "0", 'transform': "scale(1)"
                });
                if (!release_event) return;
                release_event.call(recipient);
            };
        const key_name = shortcut_combination.join('+').split(" ").join("Space");
        button.textContent = "(" + key_name + ") " + description;
        button.addEventListener("mousedown", press);
        button.addEventListener("mouseup", release);
        button.addEventListener("touchstart", press, {passive: true});
        button.addEventListener("touchend", release, {passive: true});
        if (!shortcut_combination) return;
        this.key_controls.add(shortcut_combination, press, release);
    }

    // To use class Scene, override at least one of the below functions,
    // which will be automatically called by other classes
    /**
     * Called by WebglManager for drawing.
     * @param context
     * @param program_state
     */
    display(context, program_state) {
    }

    /**
     * Called by Controls_Widget for generating interactive UI.
     */
    make_control_panel() {
    }

    /**
     * Called by Text_Widget for generating documentation.
     * @param document_section
     */
    show_explanation(document_section) {
    }
}


/**
 * **Movement_Controls** is a Scene that can be attached to a canvas, like any other
 * Scene, but it is a Secondary Scene Component -- meant to stack alongside other
 * scenes.  Rather than drawing anything it embeds both first-person and third-
 * person style controls into the website.  These can be used to manually move your
 * camera or other objects smoothly through your scene using key, mouse, and HTML
 * button controls to help you explore what's in it.
 */
class MovementControls extends Scene {
    constructor() {
        super();
        const data_members = {
            roll: 0, look_around_locked: true,
            thrust: vec3(0, 0, 0), pos: vec3(0, 0, 0), z_axis: vec3(0, 0, 0),
            radians_per_frame: 1 / 200, meters_per_frame: 20, speed_multiplier: 1
        };
        Object.assign(this, data_members);

        this.mouse_enabled_canvases = new Set();
        this.will_take_over_graphics_state = true;
    }

    set_recipient(matrix_closure, inverse_closure) {
        // set_recipient(): The camera matrix is not actually stored here inside Movement_Controls;
        // instead, track an external target matrix to modify.  Targets must be pointer references
        // made using closures.
        this.matrix = matrix_closure;
        this.inverse = inverse_closure;
    }

    reset(graphics_state) {
        // reset(): Initially, the default target is the camera matrix that Shaders use, stored in the
        // encountered program_state object.  Targets must be pointer references made using closures.
        this.set_recipient(() => graphics_state.camera_transform,
            () => graphics_state.camera_inverse);
    }

    add_mouse_controls(canvas) {
        // add_mouse_controls():  Attach HTML mouse events to the drawing canvas.
        // First, measure mouse steering, for rotating the flyaround camera:
        this.mouse = {"from_center": vec(0, 0)};
        const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
            vec(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas:
        document.addEventListener("mouseup", e => {
            this.mouse.anchor = undefined;
        });
        canvas.addEventListener("mousedown", e => {
            e.preventDefault();
            this.mouse.anchor = mouse_position(e);
        });
        canvas.addEventListener("mousemove", e => {
            e.preventDefault();
            this.mouse.from_center = mouse_position(e);
        });
        canvas.addEventListener("mouseout", e => {
            if (!this.mouse.anchor) this.mouse.from_center.scale_by(0)
        });
    }

    show_explanation(document_element) {
    }

    make_control_panel() {
        // make_control_panel(): Sets up a panel of interactive HTML elements, including
        // buttons with key bindings for affecting this scene, and live info readouts.
        this.control_panel.innerHTML += "Click and drag the scene to spin your viewpoint around it.<br>";
        this.live_string(box => box.textContent = "- Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2)
            + ", " + this.pos[2].toFixed(2));
        this.new_line();
        // The facing directions are surprisingly affected by the left hand rule:
        this.live_string(box => box.textContent = "- Facing: " + ((this.z_axis[0] > 0 ? "West " : "East ")
            + (this.z_axis[1] > 0 ? "Down " : "Up ") + (this.z_axis[2] > 0 ? "North" : "South")));
        this.new_line();
        this.new_line();

        this.key_triggered_button("Up", [" "], () => this.thrust[1] = -1, undefined, () => this.thrust[1] = 0);
        this.key_triggered_button("Forward", ["w"], () => this.thrust[2] = 1, undefined, () => this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("Left", ["a"], () => this.thrust[0] = 1, undefined, () => this.thrust[0] = 0);
        this.key_triggered_button("Back", ["s"], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0);
        this.key_triggered_button("Right", ["d"], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0);
        this.new_line();
        this.key_triggered_button("Down", ["z"], () => this.thrust[1] = 1, undefined, () => this.thrust[1] = 0);

        const speed_controls = this.control_panel.appendChild(document.createElement("span"));
        speed_controls.style.margin = "30px";
        this.key_triggered_button("-", ["o"], () =>
            this.speed_multiplier /= 1.2, undefined, undefined, undefined, speed_controls);
        this.live_string(box => {
            box.textContent = "Speed: " + this.speed_multiplier.toFixed(2)
        }, speed_controls);
        this.key_triggered_button("+", ["p"], () =>
            this.speed_multiplier *= 1.2, undefined, undefined, undefined, speed_controls);
        this.new_line();
        this.key_triggered_button("Roll left", [","], () => this.roll = 1, undefined, () => this.roll = 0);
        this.key_triggered_button("Roll right", ["."], () => this.roll = -1, undefined, () => this.roll = 0);
        this.new_line();
        this.key_triggered_button("(Un)freeze mouse look around", ["f"], () => this.look_around_locked ^= 1, "#8B8885");
        this.new_line();
        this.key_triggered_button("Go to world origin", ["r"], () => {
            this.matrix().set_identity(4, 4);
            this.inverse().set_identity(4, 4)
        }, "#8B8885");
        this.new_line();

        this.key_triggered_button("Look at origin from front", ["1"], () => {
            this.inverse().set(Mat4.look_at(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.matrix().set(Mat4.inverse(this.inverse()));
        }, "#8B8885");
        this.new_line();
        this.key_triggered_button("from right", ["2"], () => {
            this.inverse().set(Mat4.look_at(vec3(10, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.matrix().set(Mat4.inverse(this.inverse()));
        }, "#8B8885");
        this.key_triggered_button("from rear", ["3"], () => {
            this.inverse().set(Mat4.look_at(vec3(0, 0, -10), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.matrix().set(Mat4.inverse(this.inverse()));
        }, "#8B8885");
        this.key_triggered_button("from left", ["4"], () => {
            this.inverse().set(Mat4.look_at(vec3(-10, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.matrix().set(Mat4.inverse(this.inverse()));
        }, "#8B8885");
        this.new_line();
        this.key_triggered_button("Attach to global camera", ["Shift", "R"],
            () => {
                this.will_take_over_graphics_state = true
            }, "#8B8885");
        this.new_line();
    }

    first_person_flyaround(radians_per_frame, meters_per_frame, leeway = 70) {
        // (Internal helper function)
        // Compare mouse's location to all four corners of a dead box:
        const offsets_from_dead_box = {
            plus: [this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway],
            minus: [this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway]
        };
        // Apply a camera rotation movement, but only when the mouse is
        // past a minimum distance (leeway) from the canvas's center:
        if (!this.look_around_locked)
            // If steering, steer according to "mouse_from_center" vector, but don't
            // start increasing until outside a leeway window from the center.
            for (let i = 0; i < 2; i++) {                                     // The &&'s in the next line might zero the vectors out:
                let o = offsets_from_dead_box,
                    velocity = ((o.minus[i] > 0 && o.minus[i]) || (o.plus[i] < 0 && o.plus[i])) * radians_per_frame;
                // On X step, rotate around Y axis, and vice versa.
                this.matrix().post_multiply(Mat4.rotation(-velocity, i, 1 - i, 0));
                this.inverse().pre_multiply(Mat4.rotation(+velocity, i, 1 - i, 0));
            }
        this.matrix().post_multiply(Mat4.rotation(-.1 * this.roll, 0, 0, 1));
        this.inverse().pre_multiply(Mat4.rotation(+.1 * this.roll, 0, 0, 1));
        // Now apply translation movement of the camera, in the newest local coordinate frame.
        this.matrix().post_multiply(Mat4.translation(...this.thrust.times(-meters_per_frame)));
        this.inverse().pre_multiply(Mat4.translation(...this.thrust.times(+meters_per_frame)));
    }

    third_person_arcball(radians_per_frame) {
        // (Internal helper function)
        // Spin the scene around a point on an axis determined by user mouse drag:
        const dragging_vector = this.mouse.from_center.minus(this.mouse.anchor);
        if (dragging_vector.norm() <= 0)
            return;
        this.matrix().post_multiply(Mat4.translation(0, 0, -25));
        this.inverse().pre_multiply(Mat4.translation(0, 0, +25));

        const rotation = Mat4.rotation(radians_per_frame * dragging_vector.norm(),
            dragging_vector[1], dragging_vector[0], 0);
        this.matrix().post_multiply(rotation);
        this.inverse().pre_multiply(rotation);

        this.matrix().post_multiply(Mat4.translation(0, 0, +25));
        this.inverse().pre_multiply(Mat4.translation(0, 0, -25));
    }

    display(context, graphics_state, dt = graphics_state.animation_delta_time / 1000) {
        // The whole process of acting upon controls begins here.
        const m = this.speed_multiplier * this.meters_per_frame,
            r = this.speed_multiplier * this.radians_per_frame;

        if (this.will_take_over_graphics_state) {
            this.reset(graphics_state);
            this.will_take_over_graphics_state = false;
        }

        if (!this.mouse_enabled_canvases.has(context.canvas)) {
            this.add_mouse_controls(context.canvas);
            this.mouse_enabled_canvases.add(context.canvas)
        }
        // Move in first-person.  Scale the normal camera aiming speed by dt for smoothness:
        this.first_person_flyaround(dt * r, dt * m);
        // Also apply third-person "arcball" camera mode if a mouse drag is occurring:
        if (this.mouse.anchor)
            this.third_person_arcball(dt * r);
        // Log some values:
        this.pos = this.inverse().times(vec4(0, 0, 0, 1));
        this.z_axis = this.inverse().times(vec4(0, 0, 1, 0));
    }
}

class Program_State_Viewer extends Scene {
    // **Program_State_Viewer** just toggles, monitors, and reports some
    // global values via its control panel.
    make_control_panel() {
        // display() of this scene will replace the following object:
        this.program_state = {};
        this.key_triggered_button("(Un)pause animation", ["Alt", "a"], () => this.program_state.animate ^= 1);
    }

    display(context, program_state) {
        this.program_state = program_state;
    }
}

export {Scene, MovementControls}