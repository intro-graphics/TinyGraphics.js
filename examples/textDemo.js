// Pull these names into this module's scope for convenience:
import {
    color,
    Cube,
    Light,
    Mat4,
    Material,
    PhongShader,
    Scene,
    Shape,
    Square,
    Texture,
    TexturedPhong,
    vec4,
    Vector,
} from "../src/TinyGraphics.js";

/**
 * **TextLine** embeds text in the 3D world, using a crude texture
 * method.  This Shape is made of a horizontal arrangement of quads.
 * Each is textured over with images of ASCII characters, spelling
 * out a string.  Usage:  Instantiate the Shape with the desired
 * character line width.  Then assign it a single-line string by calling
 * setString("your string") on it. Draw the shape on a material
 * with full ambient weight, and text.png assigned as its texture
 * file.  For multi-line strings, repeat this process and draw with
 * a different matrix.
 */
export class TextLine extends Shape {
    constructor(maxSize) {
        super("position", "normal", "texture_coord");
        this.max_size = maxSize;
        let objectTransform = Mat4.identity();
        for (let i = 0; i < maxSize; i++) {                                       // Each quad is a separate Square instance:
            Square.insert_transformed_copy_into(this, [], objectTransform);
            objectTransform.postMultiply(Mat4.translation(1.5, 0, 0));
        }
    }

    setString(line, context) {           // setString():  Call this to overwrite the texture coordinates buffer with new
        // values per quad, which enclose each of the string's characters.
        this.arrays.texture_coord = [];
        for (let i = 0; i < this.max_size; i++) {
            let row = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt(0)) / 16),
                col = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt(0)) % 16);

            let skip = 3, size = 32, sizeFloor = size - skip;
            let dim = size * 16,
                left = (col * size + skip) / dim, top = (row * size + skip) / dim,
                right = (col * size + sizeFloor) / dim, bottom = (row * size + sizeFloor + 5) / dim;

            this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
                [left, 1 - top], [right, 1 - top]));
        }
        if (!this.existing) {
            this.copyOntoGraphicsCard(context);
            this.existing = true;
        } else
            this.copyOntoGraphicsCard(context, ["texture_coord"], false);
    }
}


export class TextDemo extends Scene {             // **TextDemo** is a scene with a cube, for demonstrating the TextLine utility Shape.
    constructor() {
        super();
        this.shapes = {cube: new Cube(), text: new TextLine(35)};
        // Don't create any DOM elements to control this scene:
        this.widget_options = {make_controls: false};

        const phong = new PhongShader();
        const texture = new TexturedPhong();
        this.grey = new Material(phong, {
            color: color(.5, .5, .5, 1), ambient: 0,
            diffusivity: .3, specularity: .5, smoothness: 10,
        });

        // To show text you need a Material like this one:
        this.text_image = new Material(texture, {
            ambient: 1, diffusivity: 0, specularity: 0,
            texture: new Texture("assets/text.png"),
        });
    }

    display(context, programState) {
        programState.lights = [new Light(vec4(3, 2, 1, 0), color(1, 1, 1, 1), 1000000),
            new Light(vec4(3, 10, 10, 1), color(1, .7, .7, 1), 100000)];
        programState.setCamera(Mat4.lookAt(...Vector.cast([0, 0, 4], [0, 0, 0], [0, 1, 0])));
        programState.projectionTransform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);

        const t = programState.animationTime / 1000;
        const funnyOrbit = Mat4.rotation(Math.PI / 4 * t, Math.cos(t), Math.sin(t), .7 * Math.cos(t));
        this.shapes.cube.draw(context, programState, funnyOrbit, this.grey);


        let strings = ["This is some text", "More text", "1234567890", "This is a line.\n\n\n" + "This is another line.",
            TextLine.toString(), TextLine.toString()];

        // Sample the "strings" array and draw them onto a cube.
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 2; j++) {             // Find the matrix for a basis located along one of the cube's sides:
                let cubeSide = Mat4.rotation(i === 0 ? Math.PI / 2 : 0, 1, 0, 0)
                    .times(Mat4.rotation(Math.PI * j - (i === 1 ? Math.PI / 2 : 0), 0, 1, 0))
                    .times(Mat4.translation(-.9, .9, 1.01));

                const multiLineString = strings[2 * i + j].split('\n');
                // Draw a Text_String for every line in our string, up to 30 lines:
                for (let line of multiLineString.slice(0, 30)) {             // Assign the string to Text_String, and then draw it.
                    this.shapes.text.setString(line, context.context);
                    this.shapes.text.draw(context, programState, funnyOrbit.times(cubeSide)
                        .times(Mat4.scale(.03, .03, .03)), this.text_image);
                    // Move our basis down a line.
                    cubeSide.postMultiply(Mat4.translation(0, -.06, 0));
                }
            }
    }
}