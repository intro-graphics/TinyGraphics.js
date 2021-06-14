class Scene {
    /**
     * **Scene** is the base class for any scene part or code snippet that you can add to a
     * canvas.  Make your own subclass(es) of this and override their methods "display()"
     * and "make_control_panel()" to make them draw to a canvas, or generate custom control
     * buttons and readouts, respectively.  Scenes exist in a hierarchy; their child Scenes
     * can either contribute more drawn shapes or provide some additional tool to the end
     * user via drawing additional control panel buttons or live text readouts.
     */
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

    new_line(parent = this.control_panel) {
        // new_line():  Formats a scene's control panel with a new line break.
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
     * Called by Webgl_Manager for drawing.
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