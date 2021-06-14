class Keyboard_Manager {
    // The constructor
    // optionally takes "target", which is the desired DOM element for keys to be pressed inside of, and
    // "callback_behavior", which will be called for every key action and allows extra behavior on each event
    // -- giving an opportunity to customize their bubbling, preventDefault, and more.  It defaults to no
    // additional behavior besides the callback itself on each assigned key action.
    /**
     * **Keyboard_Manager** maintains a running list of which keys are depressed.  You can map combinations of
     * shortcut keys to trigger callbacks you provide by calling add(). The shortcut
     * list is indexed by convenient strings showing each bound shortcut combination.
     * @param target
     * @param callback_behavior
     */
    constructor(target = document, callback_behavior = (callback, event) => callback(event)) {
        this.saved_controls = {};
        this.actively_pressed_keys = new Set();
        this.callback_behavior = callback_behavior;
        target.addEventListener("keydown", this.key_down_handler.bind(this));
        target.addEventListener("keyup", this.key_up_handler.bind(this));
        window.addEventListener("focus", () => this.actively_pressed_keys.clear());
        // Deal with stuck keys during focus change.
    }

    key_down_handler(event) {
        if (["INPUT", "TEXTAREA"].includes(event.target.tagName))
            return;
        // Don't interfere with typing.
        this.actively_pressed_keys.add(event.key);
        // Track the pressed key.
        for (let saved of Object.values(this.saved_controls)) {
            // Re-check all the keydown handlers.
            if (saved.shortcut_combination.every(s => this.actively_pressed_keys.has(s))
                && event.ctrlKey === saved.shortcut_combination.includes("Control")
                && event.shiftKey === saved.shortcut_combination.includes("Shift")
                && event.altKey === saved.shortcut_combination.includes("Alt")
                && event.metaKey === saved.shortcut_combination.includes("Meta"))
                // Modifiers must exactly match.
                this.callback_behavior(saved.callback, event);
            // The keys match, so fire the callback.
        }
    }

    key_up_handler(event) {
        const lower_symbols = "qwertyuiopasdfghjklzxcvbnm1234567890-=[]\\;',./",
            upper_symbols = "QWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*()_+{}|:\"<>?";

        const lifted_key_symbols = [event.key, upper_symbols[lower_symbols.indexOf(event.key)],
            lower_symbols[upper_symbols.indexOf(event.key)]];
        // Call keyup for any shortcuts
        for (let saved of Object.values(this.saved_controls))                          // that depended on the released
            if (lifted_key_symbols.some(s => saved.shortcut_combination.includes(s)))  // key or its shift-key counterparts.
                this.callback_behavior(saved.keyup_callback, event);                  // The keys match, so fire the callback.
        lifted_key_symbols.forEach(k => this.actively_pressed_keys.delete(k));
    }

    add(shortcut_combination, callback = () => {
    }, keyup_callback = () => {
    }) {
        // add(): Creates a keyboard operation.  The argument shortcut_combination wants an
        // array of strings that follow standard KeyboardEvent key names. Both the keyup
        // and keydown callbacks for any key combo are optional.
        this.saved_controls[shortcut_combination.join('+')] = {shortcut_combination, callback, keyup_callback};
    }
}

export {Keyboard_Manager}