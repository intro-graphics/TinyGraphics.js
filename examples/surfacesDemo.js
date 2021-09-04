// Pull these names into this module's scope for convenience:
import {
    AxisArrows,
    CappedCylinder,
    ClosedCone,
    color,
    ConeTip,
    Cube,
    CylindricalTube,
    GridPatch,
    GridSphere,
    Light,
    Mat4,
    Material,
    MovementControls,
    PhongShader,
    Regular2dPolygon,
    RoundedCappedCylinder,
    RoundedClosedCone,
    Scene,
    SubdivisionSphere,
    SurfaceOfRevolution,
    Texture,
    TexturedPhong,
    Torus,
    vec3,
    vec4,
    Vector3,
} from "../src/TinyGraphics.js";
import {CanvasWidget, CodeWidget} from "../main-scene.js";

export class SurfacesDemo extends Scene {
    constructor(scene_id, material) {
        super();

        if (typeof (scene_id) === "undefined") {
            this.is_master = true;
            this.sections = [];
        }

        this.num_scenes = 7;

        this.scene_id = scene_id;
        this.material = material;

        // Don't create any DOM elements to control this scene:
        this.widget_options = {make_controls: false};

        if (this.is_master) {
            const textured = new TexturedPhong(1);
            this.material = new Material(textured, {ambient: .5, texture: new Texture("assets/rgb.jpg")});

            for (let i = 0; i < this.num_scenes; i++)
                this.sections.push(new SurfacesDemo(i, this.material));
        } else
            this["construct_scene_" + scene_id]();
    }

    construct_scene_0() {
        const initial_corner_point = vec3(-1, -1, 0);
        // These two callbacks will step along s and t of the first sheet:
        const row_operation = (s, p) => p ? Mat4.translation(0, .2, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation = (t, p) => Mat4.translation(.2, 0, 0).times(p.to4(1)).to3();
        // These two callbacks will step along s and t of the second sheet:
        const row_operation_2 = (s, p) => vec3(-1, 2 * s - 1, Math.random() / 2);
        const column_operation_2 = (t, p, s) => vec3(2 * t - 1, 2 * s - 1, Math.random() / 2);

        this.shapes = {
            sheet: new GridPatch(10, 10, row_operation, column_operation),
            sheet2: new GridPatch(10, 10, row_operation_2, column_operation_2),
        };
    }

    construct_scene_1() {
        const initial_corner_point = vec3(-1, -1, 0);
        const row_operation = (s, p) => p ? Mat4.translation(0, .2, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation = (t, p) => Mat4.translation(.2, 0, 0).times(p.to4(1)).to3();
        this.shapes = {sheet: new GridPatch(10, 10, row_operation, column_operation)};
    }

    construct_scene_2() {
        this.shapes = {
            donut: new Torus(15, 15, [[0, 2], [0, 1]]),
            hexagon: new Regular2dPolygon(1, 5),
            cone: new ConeTip(4, 10, [[0, 2], [0, 1]]),
            tube: new CylindricalTube(1, 10, [[0, 2], [0, 1]]),
            ball: new GridSphere(6, 6, [[0, 2], [0, 1]]),
            donut2: new (Torus.prototype.makeFlatShadedVersion())(20, 20, [[0, 2], [0, 1]]),
        };
    }

    construct_scene_3() {
        const points = Vector3.cast([0, 0, .8], [.5, 0, 1], [.5, 0, .8], [.4, 0, .7], [.4, 0, .5], [.5, 0, .4], [.5, 0, -1], [.4, 0, -1.5], [.25, 0, -1.8], [0, 0, -1.7]);

        this.shapes = {bullet: new SurfaceOfRevolution(9, 9, points)};

        const phong = new PhongShader(1);
        this.solid = new Material(phong, {diffusivity: .5, smoothness: 800, color: color(.7, .8, .6, 1)});
    }

    construct_scene_4() {
        this.shapes = {
            axis: new AxisArrows(),
            ball: new SubdivisionSphere(3),
            box: new Cube(),
            cone_0: new ClosedCone(4, 10, [[.67, 1], [0, 1]]),
            tube_0: new CylindricalTube(7, 7, [[.67, 1], [0, 1]]),
            cone_1: new ClosedCone(4, 10, [[.34, .66], [0, 1]]),
            tube_1: new CylindricalTube(7, 7, [[.34, .66], [0, 1]]),
            cone_2: new ClosedCone(4, 10, [[0, .33], [0, 1]]),
            tube_2: new CylindricalTube(7, 7, [[0, .33], [0, 1]]),
        };
    }

    construct_scene_5() {
        this.shapes = {
            box: new Cube(),
            cone: new ClosedCone(4, 10, [[0, 2], [0, 1]]),
            capped: new CappedCylinder(1, 10, [[0, 2], [0, 1]]),
            cone2: new RoundedClosedCone(5, 10, [[0, 2], [0, 1]]),
            capped2: new RoundedCappedCylinder(5, 10, [[0, 2], [0, 1]]),
        };
    }

    construct_scene_6() { // Some helper arrays of points located along curves.  We'll extrude these into surfaces:
        let square_array = Vector3.cast([1, 0, -1], [0, 1, -1], [-1, 0, -1], [0, -1, -1], [1, 0, -1]),
            star_array = Array(19).fill(vec3(1, 0, -1));

        // Fill in the correct points for a 1D star curve:

        star_array = star_array.map((x, i, a) =>
            Mat4.rotation(i / (a.length - 1) * 2 * Math.PI, 0, 0, 1)
                .times(Mat4.translation((i % 2) / 2, 0, 0))
                .times(x.to4(1)).to3());

        // The square is transformed away from the origin:

        square_array = square_array.map((x, i, a) =>
            a[i] = Mat4.rotation(.5 * Math.PI, 1, 1, 1)
                .times(Mat4.translation(0, 0, 2))
                .times(x.to4(1)).to3());

        // Now that we have two 1D curves, let's make a surface between them:

        let sampler1 = i => GridPatch.sample_array(square_array, i);
        let sampler2 = i => GridPatch.sample_array(star_array, i);

        let sample_two_arrays = (j, p, i) => sampler2(i).mix(sampler1(i), j);


        this.shapes = {
            shell: new GridPatch(30, 30, sampler2, sample_two_arrays, [[0, 1], [0, 1]]),
        };
    }

    display_scene_0(context, programState) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new MovementControls());
            programState.setCamera(Mat4.translation(0, 0, -3));
        }
        // Draw the sheets, flipped 180 degrees so their normals point at us.
        const r = Mat4.rotation(Math.PI, 0, 1, 0).times(this.r);
        this.shapes.sheet.draw(context, programState, Mat4.translation(-1.5, 0, 0).times(r), this.material);
        this.shapes.sheet2.draw(context, programState, Mat4.translation(1.5, 0, 0).times(r), this.material);
    }

    display_scene_1(context, programState) {
        const random = (x) => Math.sin(1000 * x + programState.animationTime / 1000);

        // Update the JavaScript-side shape with new vertices:
        this.shapes.sheet.arrays.position.forEach((p, i, a) =>
            a[i] = vec3(p[0], p[1], .15 * random(i / a.length)));
        // Update the normals to reflect the surface's new arrangement.
        // This won't be perfect flat shading because vertices are shared.
        this.shapes.sheet.makeFlatShadedVersion();
        // Draw the current sheet shape.
        this.shapes.sheet.draw(context, programState, this.r, this.material);

        // Update the gpu-side shape with new vertices.
        // Warning:  You can't call this until you've already drawn the shape once.
        this.shapes.sheet.copyOntoGraphicsCard(context.context, ["position", "normal"], false);
    }

    display_scene_2(context, programState) {
        const model_transform = Mat4.translation(-5, 0, -2);
        // Draw all the shapes stored in this.shapes side by side.
        for (let s of Object.values(this.shapes)) {
            s.draw(context, programState, model_transform.times(this.r), this.material);
            model_transform.postMultiply(Mat4.translation(2, 0, 0));
        }
    }

    display_scene_3(context, programState) {
        const model_transform = Mat4.rotation(programState.animationTime / 5000, 0, 1, 0);
        this.shapes.bullet.draw(context, programState, model_transform.times(this.r), this.solid);
    }

    display_scene_4(context, programState) {                                       // First, draw the compound axis shape all at once:
        this.shapes.axis.draw(context, programState, Mat4.translation(2, -1, -2), this.material);

        // Manually recreate the above compound Shape out of individual components:
        const base = Mat4.translation(-1, -1, -2);
        const ball_matrix = base.times(Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(.25, .25, .25)));
        this.shapes.ball.draw(context, programState, ball_matrix, this.material);
        const matrices = [Mat4.identity(),
            Mat4.rotation(-Math.PI / 2, 1, 0, 0).times(Mat4.scale(1, -1, 1)),
            Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(-1, 1, 1))];
        for (let i = 0; i < 3; i++) {
            const m = base.times(matrices[i]);
            const cone_matrix = m.times(Mat4.translation(0, 0, 2)).times(Mat4.scale(.25, .25, .25)),
                box1_matrix = m.times(Mat4.translation(.95, .95, .45)).times(Mat4.scale(.05, .05, .45)),
                box2_matrix = m.times(Mat4.translation(.95, 0, .5)).times(Mat4.scale(.05, .05, .4)),
                box3_matrix = m.times(Mat4.translation(0, .95, .5)).times(Mat4.scale(.05, .05, .4)),
                tube_matrix = m.times(Mat4.translation(0, 0, 1)).times(Mat4.scale(.1, .1, 2));
            this.shapes["cone_" + i].draw(context, programState, cone_matrix, this.material);
            this.shapes.box.draw(context, programState, box1_matrix, this.material);
            this.shapes.box.draw(context, programState, box2_matrix, this.material);
            this.shapes.box.draw(context, programState, box3_matrix, this.material);
            this.shapes["tube_" + i].draw(context, programState, tube_matrix, this.material);
        }
    }

    display_scene_5(context, programState) {
        const model_transform = Mat4.translation(-5, 0, -2);
        const r = Mat4.rotation(programState.animationTime / 3000, 1, 1, 1);
        // Draw all the shapes stored in this.shapes side by side.
        for (let s of Object.values(this.shapes)) {
            s.draw(context, programState, model_transform.times(r), this.material);
            model_transform.postMultiply(Mat4.translation(2.5, 0, 0));
        }
    }

    display_scene_6(context, programState) {
        const model_transform = Mat4.rotation(programState.animationTime / 5000, 0, 1, 0);
        this.shapes.shell.draw(context, programState, model_transform.times(this.r), this.material);
    }

    explain_scene_0(documentElement) {
        documentElement.innerHTML += `<p>Parametric Surfaces can be generated by parametric functions that are driven by changes to two variables - s and t.  As either s or t increase, we can step along the shape's surface in some direction aligned with the shape, not the usual X,Y,Z axes.</p>
                                     <p>Grid_Patch is a generalized parametric surface.  It is always made of a sheet of squares arranged in rows and columns, corresponding to s and t.  The sheets are always guaranteed to have this row/column arrangement, but where it goes as you follow an edge to the next row or column over could vary.  When generating the shape below, we told it to do the most obvious thing whenever s or t increase; just increase X and Y.  A flat rectangle results.</p>
                                     <p>The shape on the right is the same except instead of building it incrementally by moving from the previous point, we assigned points manually.  The z values are a random height map.  The light is moving over its static peaks and valleys.  We have full control over where the sheet's points go.</p>
                                     <p>To create a new Grid_Patch shape, initialize it with the desired amounts of rows and columns you'd like.  The next two arguments are callback functions that return a new point given an old point (called p) and the current (s,t) coordinates.  The first callback is for rows, and will recieve arguments (s,p) back from Grid_Patch.  The second one is for columns, and will recieve arguments (t,p,s) back from Grid_Patch. </p>
                                     <p>Scroll down for more animations!</p>`;
    }

    explain_scene_1(documentElement) {
        documentElement.innerHTML += `<p>Shapes in tiny-graphics.js can also be modified and animated if need be.  The shape drawn below has vertex positions and normals that are recalculated for every frame.</p>
                                     <p>Call copyOntoGraphicsCard() on the Shape to make this happen.  Pass in the context, then an array of the buffer names you'd like to overwrite, then false to indicate that indices should be left alone.  Overwriting buffers in place saves us from slow reallocations.  Warning:  Do not try calling copyOntoGraphicsCard() to update a shape until after the shape's first draw() call has completed.</p>`;
    }

    explain_scene_2(documentElement) {
        documentElement.innerHTML += `<p>Parametric surfaces can be wrapped around themselves in circles, if increasing one of s or t causes a rotation around an axis.  These are called <a href="http://mathworld.wolfram.com/SurfaceofRevolution.html" target="blank">surfaces of revolution.</a></p>
                                     <p>To draw these using Grid_Patch, we provide another class called Surface_Of_Revolution that extends Grid_Patch and takes a set of points as input.  Surface_Of_Revolution automatically sweeps the given points around the Z axis to make each column.  Your list of points, which become the rows, could be arranged to make any 1D curve.  The direction of your points matters; be careful not to end up with your normal vectors all pointing inside out after the sweep.</p>`;
    }

    explain_scene_3(documentElement) {
        documentElement.innerHTML += `<p>Here's a surface of revolution drawn using a manually specified point list.  The points spell out a 1D curve of the outline of a bullet's right side.  The Surface_Of_Revolution sweeps this around the Z axis.</p>`;
    }

    explain_scene_4(documentElement) {
        documentElement.innerHTML += `<p>Several Shapes can be compounded together into one, forming a single high-performance array.  Both of the axis arrows shapes below look identical and contain the same shapes, but the one on the right is must faster to draw because the shapes all exist together in one Vertex_Array object.</p>`;
    }

    explain_scene_5(documentElement) {
        documentElement.innerHTML += `<p>Here are some examples of other convenient shapes that are made by compounding other shapes together.  The rightmost two are not compound shapes but rather we tried to make them with just one Surface_Of_Revolution, preventing us from getting good crisp seams at the edges.</p>`;
    }

    explain_scene_6(documentElement) {
        documentElement.innerHTML += `<p>Blending two 1D curves as a "ruled surface" using the "mix" function of vectors.  We are using hand-made lists of points for our curves, but you could have generated the points from spline functions.</p>`;
    }

    showExplanation(documentElement, webglManager) {
        if (this.is_master) {
            documentElement.style.padding = 0;
            documentElement.style.width = "1080px";
            documentElement.style.overflowY = "hidden";

            for (let i = 0; i < this.num_scenes; i++) {
                const element_1 = documentElement.appendChild(document.createElement("div"));
                element_1.className = "canvas-widget";

                const cw = new CanvasWidget(element_1, undefined,
                    {make_controls: i == 0, make_editor: false, make_code_nav: false});
                cw.webglManager.scenes.push(this.sections[i]);
                cw.webglManager.programState = webglManager.programState;
                cw.webglManager.setSize([1080, 300]);

                const element_2 = documentElement.appendChild(document.createElement("div"));
                element_2.className = "code-widget";

                const code = new CodeWidget(element_2,
                    SurfacesDemo.prototype["construct_scene_" + i],
                    [], {hide_navigator: true});

                const element_3 = documentElement.appendChild(document.createElement("div"));
                element_3.className = "code-widget";

                const code_2 = new CodeWidget(element_3,
                    SurfacesDemo.prototype["display_scene_" + i],
                    [], {hide_navigator: true});
            }

            const final_text = documentElement.appendChild(document.createElement("div"));
            final_text.innerHTML = `<p>That's all the examples.  Below is the code that generates this whole multi-part tutorial:</p>`;
        } else
            this["explain_scene_" + this.scene_id](documentElement);
    }

    display(context, programState) {
        programState.projectionTransform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 100);
        this.r = Mat4.rotation(-.5 * Math.sin(programState.animationTime / 5000), 1, 1, 1);

        if (this.is_master) {
            context.canvas.style.display = "none";
            // *** Lights: *** Values of vector or point lights.  They'll be consulted by
            // the shader when coloring shapes.  See Light's class definition for inputs.
            const t = this.t = programState.animationTime / 1000;
            const angle = Math.sin(t);
            const lightPosition = Mat4.rotation(angle, 1, 0, 0).times(vec4(0, 0, 1, 0));
            programState.lights = [new Light(lightPosition, color(1, 1, 1, 1), 1000000)];
        } else
            this["display_scene_" + this.scene_id](context, programState);
    }
}