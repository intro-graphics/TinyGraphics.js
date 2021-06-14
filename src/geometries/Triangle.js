import {Shape} from "./Shape.js";


class Triangle extends Shape {
    // **Triangle** The simplest possible 2D Shape – one triangle.  It stores 3 vertices, each
    // having their own 3D position, normal vector, and texture-space coordinate.
    constructor() {
        // Name the values we'll define per each vertex:
        super("position", "normal", "texture_coord");
        // First, specify the vertex positions -- the three point locations of an imaginary triangle:
        this.arrays.position = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];
        // Next, supply vectors that point away from the triangle face.  They should match up with
        // the points in the above list.  Normal vectors are needed so the graphics engine can
        // know if the shape is pointed at light or not, and color it accordingly.
        this.arrays.normal = [vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1)];
        //  lastly, put each point somewhere in texture space too:
        this.arrays.texture_coord = [Vector.of(0, 0), Vector.of(1, 0), Vector.of(0, 1)];
        // Index into our vertices to connect them into a whole triangle:
        this.indices = [0, 1, 2];
        // A position, normal, and texture coord fully describes one "vertex".  What's the "i"th vertex?  Simply
        // the combined data you get if you look up index "i" of those lists above -- a position, normal vector,
        // and texture coordinate together.  Lastly we told it how to connect vertex entries into triangles.
        // Every three indices in "this.indices" traces out one triangle.
    }
}

export {Triangle}