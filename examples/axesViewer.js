// Pull these names into this module's scope for convenience:
import {
    AxisArrows,
    color,
    Cube,
    Light,
    Mat4,
    Material,
    MovementControls,
    PhongShader,
    Scene,
    Texture,
    TexturedPhong,
    vec4,
} from "../src/TinyGraphics.js";


/**
 **AxesViewer** is a helper scene (a secondary Scene Component) for helping you
 visualize the coordinate bases that are used in your real scene.  Your scene
 can feed this object a list of bases to draw as axis arrows.  Pressing the
 buttons of this helper scene cycles through a list of each basis you have added,
 drawing the selected one.  Call insert() and pass it a basis to add one to the
 list.
 Always reset the data structure by calling reset() before each frame in your scene.

 Bases at the same level in your scene's hierarchy can be grouped together and
 displayed all at once; just store them at the same index in "this.groups" by
 passing the same ID number into insert().  Normally passing an ID is optional;
 omitting it inserts your basis in the next empty group.  To re-use IDs easily,
 obtain the next unused ID by calling nextGroupId(), so you can re-use it for
 all bases that you want to appear at the same level.
 **/
export class AxesViewer extends Scene {
    constructor() {
        super();

        this.selectedBasisId = 0;
        this.reset();
        this.shapes = {axes: new AxisArrows()};
        const bump = new TexturedPhong();
        this.material = new Material(bump, {
            color: color(0, 0, 0, 1), ambient: 1,
            texture: new Texture("assets/uv.png"),
        });
    }

    insert(basis, groupId = ++this.cursor) {
        // insert(): Default to putting the basis in the next empty group; otherwise
        // use group number. Update the cursor if a group number was supplied.
        this.cursor = groupId;
        if (!this.groups[groupId])
            this.groups[groupId] = [basis];
        else
            this.groups[groupId].push(basis);
    }

    nextGroupId() {
        return this.groups.length;
    }

    reset() {
        // reset(): Call this every frame -- The beginning of every call to your scene's display().
        this.groups = [[]];
        this.cursor = -1;
    }

    makeControlPanel() {
        // makeControlPanel(): Create the buttons for using the viewer.
        this.keyTriggeredButton("Previous group", ["g"], this.decrease);
        this.keyTriggeredButton("Next group", ["h"], this.increase);
        this.newLine();
        this.liveString(box => {
            box.textContent = "Selected basis id: " + this.selectedBasisId;
        });
    }

    increase() {
        this.selectedBasisId = Math.min(this.selectedBasisId + 1, this.groups.length - 1);
    }

    decrease() {
        this.selectedBasisId = Math.max(this.selectedBasisId - 1, 0);
    }   // Don't allow selection of negative IDs.
    display(context, programState) {
        // display(): Draw the selected group of axes arrows.
        if (this.groups[this.selectedBasisId])
            for (let a of this.groups[this.selectedBasisId])
                this.shapes.axes.draw(context, programState, a, this.material);
    }
}


export class AxesViewerTestScene extends Scene {
    // **AxesViewerTestScene** is an example of how your scene should properly manaage
    // an AxesViewer child scene, so that it is able to help you draw all the coordinate
    // bases in your scene's hierarchy at the correct levels.
    constructor() {
        super();
        this.children.push(this.axesViewer = new AxesViewer());
        // Scene defaults:
        this.shapes = {box: new Cube()};
        const phong = new PhongShader();
        this.material = new Material(phong, {color: color(.8, .4, .8, 1)});
    }

    makeControlPanel() {
        this.controlPanel.innerHTML += "(Substitute your own scene here)";
    }

    display(context, programState) {
        // display():  *********** See instructions below ***********
        programState.lights = [new Light(vec4(0, 0, 1, 0), color(0, 1, 1, 1), 100000)];

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new MovementControls());

            programState.setCamera(Mat4.translation(-1, -1, -20));
            // Locate the camera here (inverted matrix).
        }
        programState.projectionTransform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);
        const t = programState.animationTime / 1000, dt = programState.animationDeltaTime / 1000;
        // Mark the global coordinate axes.
        this.shapes.box.draw(context, programState, Mat4.scale(10, .1, .1), this.material);
        this.shapes.box.draw(context, programState, Mat4.scale(.1, 10, .1), this.material);
        this.shapes.box.draw(context, programState, Mat4.scale(.1, .1, 10), this.material);


        // *********** How to use the AxesViewer ***********
        // First, reset the object:
        this.axesViewer.reset();

        // Next, make your scene as usual, by incrementally modifying a transformation matrix.
        // In between every matrix operation you want to draw, call insert() on the object as shown.
        // Remember to use copy() to reference matrices by value so they don't all alias to the same one.
        let model_transform = Mat4.identity();
        this.axesViewer.insert(model_transform.copy());
        model_transform.postMultiply(Mat4.rotation(t, 0, 1, 0));
        this.axesViewer.insert(model_transform.copy());
        model_transform.postMultiply(Mat4.translation(5, 0, 0));
        this.axesViewer.insert(model_transform.copy());
        // If your scene's hierarchy is about to branch (ie. arms of a human, legs of a table),
        // we might want to store multiple bases at the same level to draw them simultaneously.
        // Obtain the next group's ID number:
        const id = this.axesViewer.nextGroupId();
        // We'll draw our scene's boxes as an outline so it doesn't block the axes.
        this.shapes.box.draw(context, programState, model_transform.times(Mat4.scale(2, 2, 2)), this.material, "LINE_STRIP");

        let center = model_transform.copy();
        for (let side of [-1, 1]) {
            model_transform = center.copy();      // Our scene returns back to this matrix twice to position the boxes.
            model_transform.postMultiply(Mat4.translation(side * 2, 2, 0));
            // Here there will be two different bases depending on our for loop.
            // By passing in the old ID here, we accomplish saving both bases at the
            // same hierarchy level so they'll be drawn together.
            this.axesViewer.insert(model_transform.copy(), id);
            model_transform.postMultiply(Mat4.rotation(Math.sin(t), 0, 0, side));
            // Count up the ID from there:
            this.axesViewer.insert(model_transform.copy());
            model_transform.postMultiply(Mat4.translation(side * 2, 2, 0));
            this.axesViewer.insert(model_transform.copy());
            // Again, draw our scene's boxes as an outline so it doesn't block the axes.
            this.shapes.box.draw(context, programState, model_transform.times(Mat4.scale(2, 2, 2)), this.material, "LINE_STRIP");
        }
    }
}
