import {color, Cube, FakeBumpMap, Light, Mat4, Material, Scene, Texture, vec3} from "../src/TinyGraphics.js";


/**
 * **ManyLightsDemo** demonstrates how to make the illusion that
 * there are many lights, despite only passing two to the shader.
 * We re-locate the lights in between individual shape draws.
 * Doing this trick performs much faster than looping through a
 * long list of lights within the fragment shader, none of which
 * need to affect every single shape in the scene.
 */
export class ManyLightsDemo extends Scene {
    constructor() {
        super();
        // Define how many boxes (buildings) to draw:
        Object.assign(this, {rows: 20, columns: 35});

        this.shapes = {cube: new Cube()};
        const shader = new FakeBumpMap();
        this.brick = new Material(shader, {
            color: color(1, 1, 1, 1),
            ambient: .05, diffusivity: .5, specularity: .5, smoothness: 10,
            texture: new Texture("assets/uv.png"),
        });

        // Don't create any DOM elements to control this scene:
        this.widget_options = {make_controls: false};

        this.box_positions = [];
        this.row_lights = {};
        this.column_lights = {};
        // Make initial grid of boxes at random heights:
        for (let row = 0; row < this.rows; row++)
            for (let column = 0; column < this.columns; column++)
                this.box_positions.push(vec3(row, -2 - 2 * Math.random(), -column).randomized(1));

        // The lights lists will function as a lookup table for the light in a current row and column:
        // Make initial light positions.  One light per row, and one light per column:
        for (let c = 0; c < this.columns; c++)
            this.row_lights    [~~(-c)] = vec3(2 * Math.random() * this.rows, -Math.random(), -c);
        for (let r = 0; r < this.rows; r++)
            this.column_lights [~~(r)] = vec3(r, -Math.random(), -2 * Math.random() * this.columns);
    }

    /**
     * Draw each frame to animate the scene.
     * @param context
     * @param programState
     */
    display(context, programState) {
        programState.setCamera(Mat4.lookAt(vec3(this.rows / 2, 5, 5), vec3(this.rows / 2, 0, -4), vec3(0, 1, 0)));
        programState.projectionTransform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);

        // To draw each individual box, select the two lights sharing
        // a row and column with it, and draw using those.
        this.box_positions.forEach((p, i, a) => {
            programState.lights = [new Light(this.row_lights   [~~p[2]].to4(1), color(p[2] % 1, 1, 1, 1), 9),
                new Light(this.column_lights[~~p[0]].to4(1), color(1, 1, p[0] % 1, 1), 9)];
            // Draw the box:
            this.shapes.cube.draw(context, programState, Mat4.translation(...p).times(Mat4.scale(.3, 1, .3)), this.brick);
        });
        if (!programState.animate || programState.animationDeltaTime > 500)
            return;
        // Move some lights forward along columns, then bound them to a range.
        for (const [key, val] of Object.entries(this.column_lights)) {
            this.column_lights[key][2] -= programState.animationDeltaTime / 50;
            this.column_lights[key][2] %= this.columns * 2;
        }
        // Move other lights forward along rows, then bound them to a range.
        for (const [key, val] of Object.entries(this.row_lights)) {
            this.row_lights[key][0] += programState.animationDeltaTime / 50;
            this.row_lights[key][0] %= this.rows * 2;
        }
        // Move the boxes backwards, then bound them to a range.
        this.box_positions.forEach((p, i, a) => {
            a[i] = p.plus(vec3(0, 0, programState.animationDeltaTime / 1000));
            if (a[i][2] > 1) a[i][2] = -this.columns + .001;
        });
    }

    showExplanation(documentElement) {
        documentElement.innerHTML += `<p>This demo shows how to make the illusion that there are many lights, despite the shader only being aware of two. The shader used here (class Phong_Shader) is told to take only two lights into account when coloring in a shape. This has the benefit of fewer lights that have to be looped through in the fragment shader, which has to run hundreds of thousands of times.

    </p><p>You can get away with seemingly having more lights in your overall scene by having the lights only affect certain shapes, such that only two are influencing any given shape at a time.   We re-locate the lights in between individual shape draws. For this to look right, it helps for shapes to be aware of which lights are nearby versus which are too far away or too small for their effects to matter, so the best pair can be chosen.

    </p><p>In this scene, one light exists per row and one per column, and a box simply looks up the lights it is sharing a row or column with.</p>`;
    }
}
