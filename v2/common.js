/**
 * @file common.js — the entry point for most programs.  Import this file to get everything:
 *
 *     import {tiny, defs} from './common.js';
 *     const {vec3, vec4, color, Mat4, Light, Shape, Material, Shader, Texture, Scene} = tiny;
 *
 * `tiny` holds the core library (tiny-graphics.js) and the page widgets (tiny-graphics-widgets.js).
 * `defs` holds the ready-made building blocks defined below: shapes, shaders, and camera controls.
 * Read them — each one is a worked example of the technique it implements.
 */
import {tiny as core} from './tiny-graphics.js';
import {widgets} from './tiny-graphics-widgets.js';

const tiny = {...core, ...widgets};
const {
    Vector, Vector3, vec, vec3, vec4, color, Matrix, Mat4,
    Light, Shape, Material, Shader, Texture, Scene
} = tiny;

const defs = {};

export {tiny, defs};

// ═════════════════════════════════════════════════════════════════════════════════════════
// Shapes
// ═════════════════════════════════════════════════════════════════════════════════════════

const Triangle = defs.Triangle =
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


const Square = defs.Square =
    class Square extends Shape {
        // **Square** demonstrates two triangles that share vertices.  On any planar surface, the
        // interior edges don't make any important seams.  In these cases there's no reason not
        // to re-use data of the common vertices between triangles.  This makes all the vertex
        // arrays (position, normals, etc) smaller and more cache friendly.
        constructor() {
            super("position", "normal", "texture_coord");
            // Specify the 4 square corner locations, and match those up with normal vectors:
            this.arrays.position = Vector3.cast([-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0]);
            this.arrays.normal = Vector3.cast([0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]);
            // Arrange the vertices into a square shape in texture space too:
            this.arrays.texture_coord = Vector.cast([0, 0], [1, 0], [0, 1], [1, 1]);
            // Use two triangles this time, indexing into four distinct vertices:
            this.indices.push(0, 1, 2, 1, 3, 2);
        }
    }


const Tetrahedron = defs.Tetrahedron =
    class Tetrahedron extends Shape {
        // **Tetrahedron** demonstrates flat vs smooth shading (a boolean argument selects
        // which one).  It is also our first 3D, non-planar shape.  Four triangles share
        // corners with each other.  Unless we store duplicate points at each corner
        // (storing the same position at each, but different normal vectors), the lighting
        // will look "off".  To get crisp seams at the edges we need the repeats.
        constructor(using_flat_shading) {
            super("position", "normal", "texture_coord");
            const a = 1 / Math.sqrt(3);
            if (!using_flat_shading) {
                // Method 1:  A tetrahedron with shared vertices.  Compact, performs better,
                // but can't produce flat shading or discontinuous seams in textures.
                this.arrays.position = Vector.cast([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
                this.arrays.normal = Vector.cast([-a, -a, -a], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
                this.arrays.texture_coord = Vector.cast([0, 0], [1, 0], [0, 1,], [1, 1]);
                // Notice the repeats in the index list.  Vertices are shared
                // and appear in multiple triangles with this method.
                this.indices.push(0, 1, 2, 0, 1, 3, 0, 2, 3, 1, 2, 3);
            } else {
                // Method 2:  A tetrahedron with four independent triangles.
                this.arrays.position = Vector.cast([0, 0, 0], [1, 0, 0], [0, 1, 0],
                    [0, 0, 0], [1, 0, 0], [0, 0, 1],
                    [0, 0, 0], [0, 1, 0], [0, 0, 1],
                    [0, 0, 1], [1, 0, 0], [0, 1, 0]);

                // The essence of flat shading:  This time, values of normal vectors can
                // be constant per whole triangle.  Repeat them for all three vertices.
                this.arrays.normal = Vector.cast([0, 0, -1], [0, 0, -1], [0, 0, -1],
                    [0, -1, 0], [0, -1, 0], [0, -1, 0],
                    [-1, 0, 0], [-1, 0, 0], [-1, 0, 0],
                    [a, a, a], [a, a, a], [a, a, a]);

                // Each face in Method 2 also gets its own set of texture coords (half the
                // image is mapped onto each face).  We couldn't do this with shared
                // vertices since this features abrupt transitions when approaching the
                // same point from different directions.
                this.arrays.texture_coord = Vector.cast([0, 0], [1, 0], [1, 1],
                    [0, 0], [1, 0], [1, 1],
                    [0, 0], [1, 0], [1, 1],
                    [0, 0], [1, 0], [1, 1]);
                // Notice all vertices are unique this time.
                this.indices.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11);
            }
        }
    }

const Windmill = defs.Windmill =
    class Windmill extends Shape {
        // **Windmill**  As our shapes get more complicated, we begin using matrices and flow
        // control (including loops) to generate non-trivial point clouds and connect them.
        constructor(num_blades) {
            super("position", "normal", "texture_coord");
            // A for loop to automatically generate the triangles:
            for (let i = 0; i < num_blades; i++) {
                // Rotate around a few degrees in the XZ plane to place each new point:
                const spin = Mat4.rotation(i * 2 * Math.PI / num_blades, 0, 1, 0);
                // Apply that XZ rotation matrix to point (1,0,0) of the base triangle.
                const newPoint = spin.times(vec4(1, 0, 0, 1)).to3();
                const triangle = [newPoint,                      // Store that XZ position as point 1.
                    newPoint.plus([0, 1, 0]),    // Store it again but with higher y coord as point 2.
                    vec3(0, 0, 0)];          // All triangles touch this location -- point 3.

                this.arrays.position.push(...triangle);
                // Rotate our base triangle's normal (0,0,1) to get the new one.  Careful!  Normal vectors are not
                // points; their perpendicularity constraint gives them a mathematical quirk that when applying
                // matrices you have to apply the transposed inverse of that matrix instead.  But right now we've
                // got a pure rotation matrix, where the inverse and transpose operations cancel out, so it's ok.
                const newNormal = spin.times(vec4(0, 0, 1, 0)).to3();
                // Propagate the same normal to all three vertices:
                this.arrays.normal.push(newNormal, newNormal, newNormal);
                this.arrays.texture_coord.push(...Vector.cast([0, 0], [0, 1], [1, 0]));
                // Procedurally connect the 3 new vertices into triangles:
                this.indices.push(3 * i, 3 * i + 1, 3 * i + 2);
            }
        }
    }


const Cube = defs.Cube =
    class Cube extends Shape {
        // **Cube** A closed 3D shape, and the first example of a compound shape (a Shape constructed
        // out of other Shapes).  A cube inserts six Square strips into its own arrays, using six
        // different matrices as offsets for each square.
        constructor() {
            super("position", "normal", "texture_coord");
            // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 2; j++) {
                    const square_transform = Mat4.rotation(i == 0 ? Math.PI / 2 : 0, 1, 0, 0)
                        .times(Mat4.rotation(Math.PI * j - (i == 1 ? Math.PI / 2 : 0), 0, 1, 0))
                        .times(Mat4.translation(0, 0, 1));
                    // Calling this function of a Square (or any Shape) copies it into the specified
                    // Shape (this one) at the specified matrix offset (square_transform):
                    Square.insert_transformed_copy_into(this, [], square_transform);
                }
        }
    }


const Subdivision_Sphere = defs.Subdivision_Sphere =
    class Subdivision_Sphere extends Shape {
        // **Subdivision_Sphere** defines a Sphere surface, with nice uniform triangles.  A subdivision surface
        // (see Wikipedia article on those) is initially simple, then builds itself into a more and more
        // detailed shape of the same layout.  Each act of subdivision makes it a better approximation of
        // some desired mathematical surface by projecting each new point onto that surface's known
        // implicit equation.  For a sphere, we begin with a closed 3-simplex (a tetrahedron).  For each
        // face, connect the midpoints of each edge together to make more faces.  Repeat recursively until
        // the desired level of detail is obtained.  Project all new vertices to unit vectors (onto the
        // unit sphere) and group them into triangles by following the predictable pattern of the recursion.
        constructor(max_subdivisions) {
            super("position", "normal", "texture_coord");
            // Start from the following equilateral tetrahedron:
            const tetrahedron = [[0, 0, -1], [0, .9428, .3333], [-.8165, -.4714, .3333], [.8165, -.4714, .3333]];
            this.arrays.position = Vector3.cast(...tetrahedron);
            // Begin recursion:
            this.subdivide_triangle(0, 1, 2, max_subdivisions);
            this.subdivide_triangle(3, 2, 1, max_subdivisions);
            this.subdivide_triangle(1, 0, 3, max_subdivisions);
            this.subdivide_triangle(0, 2, 3, max_subdivisions);

            // With positions calculated, fill in normals and texture_coords of the finished Sphere:
            for (let p of this.arrays.position) {
                // Each point has a normal vector that simply goes to the point from the origin:
                this.arrays.normal.push(p.copy());

                // Textures are tricky.  A Subdivision sphere has no straight seams to which image
                // edges in UV space can be mapped.  The only way to avoid artifacts is to smoothly
                // wrap & unwrap the image in reverse - displaying the texture twice on the sphere.
                //  this.arrays.texture_coord.push( Vector.of( Math.asin( p[0]/Math.PI ) + .5, Math.asin( p[1]/Math.PI ) + .5 ) );
                this.arrays.texture_coord.push(Vector.of(
                    0.5 - Math.atan2(p[2], p[0]) / (2 * Math.PI),
                    0.5 + Math.asin(p[1]) / Math.PI));
            }

            // Fix the UV seam by duplicating vertices with offset UV:
            const tex = this.arrays.texture_coord;
            for (let i = 0; i < this.indices.length; i += 3) {
                const a = this.indices[i], b = this.indices[i + 1], c = this.indices[i + 2];
                if ([[a, b], [a, c], [b, c]].some(x => (Math.abs(tex[x[0]][0] - tex[x[1]][0]) > 0.5))
                    && [a, b, c].some(x => tex[x][0] < 0.5)) {
                    for (let q of [[a, i], [b, i + 1], [c, i + 2]]) {
                        if (tex[q[0]][0] < 0.5) {
                            this.indices[q[1]] = this.arrays.position.length;
                            this.arrays.position.push(this.arrays.position[q[0]].copy());
                            this.arrays.normal.push(this.arrays.normal  [q[0]].copy());
                            tex.push(tex[q[0]].plus(vec(1, 0)));
                        }
                    }
                }
            }
        }

        subdivide_triangle(a, b, c, count) {
            // subdivide_triangle(): Recurse through each level of detail
            // by splitting triangle (a,b,c) into four smaller ones.
            if (count <= 0) {
                // Base case of recursion - we've hit the finest level of detail we want.
                this.indices.push(a, b, c);
                return;
            }
            // So we're not at the base case.  So, build 3 new vertices at midpoints,
            // and extrude them out to touch the unit sphere (length 1).
            let ab_vert = this.arrays.position[a].mix(this.arrays.position[b], 0.5).normalized(),
                ac_vert = this.arrays.position[a].mix(this.arrays.position[c], 0.5).normalized(),
                bc_vert = this.arrays.position[b].mix(this.arrays.position[c], 0.5).normalized();
            // Here, push() returns the indices of the three new vertices (plus one).
            let ab = this.arrays.position.push(ab_vert) - 1,
                ac = this.arrays.position.push(ac_vert) - 1,
                bc = this.arrays.position.push(bc_vert) - 1;
            // Recurse on four smaller triangles, and we're done.  Skipping every fourth vertex index in
            // our list takes you down one level of detail, and so on, due to the way we're building it.
            this.subdivide_triangle(a, ab, ac, count - 1);
            this.subdivide_triangle(ab, b, bc, count - 1);
            this.subdivide_triangle(ac, bc, c, count - 1);
            this.subdivide_triangle(ab, bc, ac, count - 1);
        }
    }


const Grid_Patch = defs.Grid_Patch =
    class Grid_Patch extends Shape {
        // A grid of rows and columns you can distort. A tesselation of triangles connects the
        // points, generated with a certain predictable pattern of indices.  Two callbacks
        // allow you to dynamically define how to reach the next row or column.
        constructor(rows, columns, next_row_function, next_column_function, texture_coord_range = [[0, rows], [0, columns]]) {
            super("position", "normal", "texture_coord");
            let points = [];
            for (let r = 0; r <= rows; r++) {
                points.push(new Array(columns + 1));
                // Allocate a 2D array.
                // Use next_row_function to generate the start point of each row. Pass in the progress ratio,
                // and the previous point if it existed.
                points[r][0] = next_row_function(r / rows, points[r - 1] && points[r - 1][0]);
            }
            for (let r = 0; r <= rows; r++) {
                // From those, use next_column function to generate the remaining points:
                for (let c = 0; c <= columns; c++) {
                    if (c > 0) points[r][c] = next_column_function(c / columns, points[r][c - 1], r / rows);

                    this.arrays.position.push(points[r][c]);
                    // Interpolate texture coords from a provided range.
                    const a1 = c / columns, a2 = r / rows, x_range = texture_coord_range[0],
                        y_range = texture_coord_range[1];
                    this.arrays.texture_coord.push(vec((a1) * x_range[1] + (1 - a1) * x_range[0], (a2) * y_range[1] + (1 - a2) * y_range[0]));
                }
            }

            for (let r = 0; r <= rows; r++) {
                // Generate normals by averaging the cross products of all defined neighbor pairs.
                for (let c = 0; c <= columns; c++) {
                    let curr = points[r][c], neighbors = new Array(4), normal = vec3(0, 0, 0);
                    // Store each neighbor by rotational order.
                    for (let [i, dir] of [[-1, 0], [0, 1], [1, 0], [0, -1]].entries())
                        neighbors[i] = points[r + dir[1]] && points[r + dir[1]][c + dir[0]];
                    // Leave "undefined" in the array wherever
                    // we hit a boundary.
                    // Take cross-products of pairs of neighbors, proceeding
                    // a consistent rotational direction through the pairs:
                    for (let i = 0; i < 4; i++)
                        if (neighbors[i] && neighbors[(i + 1) % 4])
                            normal = normal.plus(neighbors[i].minus(curr).cross(neighbors[(i + 1) % 4].minus(curr)));
                    normal.normalize();
                    // Normalize the sum to get the average vector.
                    // Store the normal if it's valid (not NaN or zero length), otherwise use a default:
                    if (normal.every(x => x == x) && normal.norm() > .01) this.arrays.normal.push(normal.copy());
                    else this.arrays.normal.push(vec3(0, 0, 1));
                }
            }


            for (let h = 0; h < rows; h++) {
                // Generate a sequence like this (if #columns is 10):
                for (let i = 0; i < 2 * columns; i++)    // "1 11 0  11 1 12  2 12 1  12 2 13  3 13 2  13 3 14  4 14 3..."
                    for (let j = 0; j < 3; j++)
                        this.indices.push(h * (columns + 1) + columns * ((i + (j % 2)) % 2) + (~~((j % 3) / 2) ?
                            (~~(i / 2) + 2 * (i % 2)) : (~~(i / 2) + 1)));
            }
        }

        static sample_array(array, ratio) {
            // Optional but sometimes useful as a next row or column operation. In a given array
            // of points, intepolate the pair of points that our progress ratio falls between.
            const frac = ratio * (array.length - 1), alpha = frac - Math.floor(frac);
            return array[Math.floor(frac)].mix(array[Math.ceil(frac)], alpha);
        }
    }


const Surface_Of_Revolution = defs.Surface_Of_Revolution =
    class Surface_Of_Revolution extends Grid_Patch {
        // SURFACE OF REVOLUTION: Produce a curved "sheet" of triangles with rows and columns.
        // Begin with an input array of points, defining a 1D path curving through 3D space --
        // now let each such point be a row.  Sweep that whole curve around the Z axis in equal
        // steps, stopping and storing new points along the way; let each step be a column. Now
        // we have a flexible "generalized cylinder" spanning an area until total_curvature_angle.
        constructor(rows, columns, points, texture_coord_range, total_curvature_angle = 2 * Math.PI) {
            const row_operation = i => Grid_Patch.sample_array(points, i),
                column_operation = (j, p) => Mat4.rotation(total_curvature_angle / columns, 0, 0, 1).times(p.to4(1)).to3();

            super(rows, columns, row_operation, column_operation, texture_coord_range);
        }
    }


const Regular_2D_Polygon = defs.Regular_2D_Polygon =
    class Regular_2D_Polygon extends Surface_Of_Revolution {
        // Approximates a flat disk / circle
        constructor(rows, columns) {
            super(rows, columns, Vector3.cast([0, 0, 0], [1, 0, 0]));
            this.arrays.normal = this.arrays.normal.map(x => vec3(0, 0, 1));
            this.arrays.texture_coord.forEach((x, i, a) => a[i] = this.arrays.position[i].map(x => x / 2 + .5).slice(0, 2));
        }
    }

const Cylindrical_Tube = defs.Cylindrical_Tube =
    class Cylindrical_Tube extends Surface_Of_Revolution {
        // An open tube shape with equally sized sections, pointing down Z locally.
        constructor(rows, columns, texture_range) {
            super(rows, columns, Vector3.cast([1, 0, .5], [1, 0, -.5]), texture_range);
        }
    }

const Cone_Tip = defs.Cone_Tip =
    class Cone_Tip extends Surface_Of_Revolution {
        // Note:  Touches the Z axis; squares degenerate into triangles as they sweep around.
        constructor(rows, columns, texture_range) {
            super(rows, columns, Vector3.cast([0, 0, 1], [1, 0, -1]), texture_range);
        }
    }

const Torus = defs.Torus =
    class Torus extends Shape {
        // Build a donut shape.  An example of a surface of revolution.
        constructor(rows, columns, texture_range) {
            super("position", "normal", "texture_coord");
            const circle_points = Array(rows).fill(vec3(1 / 3, 0, 0))
                .map((p, i, a) => Mat4.translation(-2 / 3, 0, 0)
                    .times(Mat4.rotation(i / (a.length - 1) * 2 * Math.PI, 0, -1, 0))
                    .times(Mat4.scale(1, 1, 3))
                    .times(p.to4(1)).to3());
            Surface_Of_Revolution.insert_transformed_copy_into(this, [rows, columns, circle_points, texture_range]);
        }
    }

const Grid_Sphere = defs.Grid_Sphere =
    class Grid_Sphere extends Shape {
        // With lattitude / longitude divisions; this means singularities are at
        constructor(rows, columns, texture_range) {
            // the mesh's top and bottom.  Subdivision_Sphere is a better alternative.
            super("position", "normal", "texture_coord");
            const semi_circle_points = Array(rows).fill(vec3(0, 0, 1)).map((x, i, a) =>
                Mat4.rotation(i / (a.length - 1) * Math.PI, 0, 1, 0).times(x.to4(1)).to3());

            Surface_Of_Revolution.insert_transformed_copy_into(this, [rows, columns, semi_circle_points, texture_range]);
        }
    }

const Closed_Cone = defs.Closed_Cone =
    class Closed_Cone extends Shape {
        // Combine a cone tip and a regular polygon to make a closed cone.
        constructor(rows, columns, texture_range) {
            super("position", "normal", "texture_coord");
            Cone_Tip.insert_transformed_copy_into(this, [rows, columns, texture_range]);
            Regular_2D_Polygon.insert_transformed_copy_into(this, [1, columns], Mat4.rotation(Math.PI, 0, 1, 0)
                .times(Mat4.translation(0, 0, 1)));
        }
    }

const Rounded_Closed_Cone = defs.Rounded_Closed_Cone =
    class Rounded_Closed_Cone extends Surface_Of_Revolution {
        // An alternative without two separate sections
        constructor(rows, columns, texture_range) {
            super(rows, columns, [vec3(0, 0, 1), vec3(1, 0, -1), vec3(0, 0, -1)], texture_range);
        }
    }

const Capped_Cylinder = defs.Capped_Cylinder =
    class Capped_Cylinder extends Shape {
        // Combine a tube and two regular polygons to make a closed cylinder.
        constructor(rows, columns, texture_range) {
            // Flat shade this to make a prism, where #columns = #sides.
            super("position", "normal", "texture_coord");
            Cylindrical_Tube.insert_transformed_copy_into(this, [rows, columns, texture_range]);
            Regular_2D_Polygon.insert_transformed_copy_into(this, [1, columns], Mat4.translation(0, 0, .5));
            Regular_2D_Polygon.insert_transformed_copy_into(this, [1, columns], Mat4.rotation(Math.PI, 0, 1, 0).times(Mat4.translation(0, 0, .5)));
        }
    }

const Rounded_Capped_Cylinder = defs.Rounded_Capped_Cylinder =
    class Rounded_Capped_Cylinder extends Surface_Of_Revolution {
        // An alternative without three separate sections
        constructor(rows, columns, texture_range) {
            super(rows, columns, [vec3(0, 0, .5), vec3(1, 0, .5), vec3(1, 0, -.5), vec3(0, 0, -.5)], texture_range)
        }
    }


const Axis_Arrows = defs.Axis_Arrows =
    class Axis_Arrows extends Shape {
        // An axis set with arrows, made out of a lot of various primitives.
        constructor() {
            super("position", "normal", "texture_coord");
            let stack = [];
            Subdivision_Sphere.insert_transformed_copy_into(this, [3], Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(.25, .25, .25)));
            this.drawOneAxis(Mat4.identity(), [[.67, 1], [0, 1]]);
            this.drawOneAxis(Mat4.rotation(-Math.PI / 2, 1, 0, 0).times(Mat4.scale(1, -1, 1)), [[.34, .66], [0, 1]]);
            this.drawOneAxis(Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(-1, 1, 1)), [[0, .33], [0, 1]]);
        }

        drawOneAxis(transform, tex) {
            // Use a different texture coordinate range for each of the three axes, so they show up differently.
            Closed_Cone.insert_transformed_copy_into(this, [4, 10, tex], transform.times(Mat4.translation(0, 0, 2)).times(Mat4.scale(.25, .25, .25)));
            Cube.insert_transformed_copy_into(this, [], transform.times(Mat4.translation(.95, .95, .45)).times(Mat4.scale(.05, .05, .45)));
            Cube.insert_transformed_copy_into(this, [], transform.times(Mat4.translation(.95, 0, .5)).times(Mat4.scale(.05, .05, .4)));
            Cube.insert_transformed_copy_into(this, [], transform.times(Mat4.translation(0, .95, .5)).times(Mat4.scale(.05, .05, .4)));
            Cylindrical_Tube.insert_transformed_copy_into(this, [7, 7, tex], transform.times(Mat4.translation(0, 0, 1)).times(Mat4.scale(.1, .1, 2)));
        }
    }


const Minimal_Shape = defs.Minimal_Shape =
    class Minimal_Shape extends tiny.Vertex_Buffer {
        // **Minimal_Shape** an even more minimal triangle, with three
        // vertices each holding a 3D position and a color.
        constructor() {
            super("position", "color");
            // Describe the where the points of a triangle are in space, and also describe their colors:
            this.arrays.position = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];
            this.arrays.color = [color(1, 0, 0, 1), color(0, 1, 0, 1), color(0, 0, 1, 1)];
        }
    }


// ═════════════════════════════════════════════════════════════════════════════════════════
// Shaders
// ═════════════════════════════════════════════════════════════════════════════════════════

const Basic_Shader = defs.Basic_Shader =
    class Basic_Shader extends Shader {
        // **Basic_Shader** — nearly the simplest possible Shader: transform each vertex by
        // projection · view · model, and color it with the color stored at that vertex.
        update_GPU(gl, gpu_addresses, program_state, model_transform, material) {
            const PVM = program_state.projection_transform.times(program_state.view_transform).times(model_transform);
            gl.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false, Matrix.column_major(PVM));
        }

        vertex_glsl_code() {
            return `#version 300 es
                precision mediump float;
                in vec3 position;                           // object space
                in vec4 color;
                uniform mat4 projection_camera_model_transform;
                out vec4 VERTEX_COLOR;

                void main() {
                    gl_Position = projection_camera_model_transform * vec4(position, 1.0);
                    VERTEX_COLOR = color;
                }`;
        }

        fragment_glsl_code() {
            return `#version 300 es
                precision mediump float;
                in vec4 VERTEX_COLOR;                       // interpolated between the three vertices
                out vec4 frag_color;

                void main() {
                    frag_color = VERTEX_COLOR;
                }`;
        }
    };


const Funny_Shader = defs.Funny_Shader =
    class Funny_Shader extends Shader {
        // **Funny_Shader** — a "procedural texture": the color is a formula of the texture
        // coordinates and time, with no image involved.
        update_GPU(gl, gpu_addresses, program_state, model_transform, material) {
            const PVM = program_state.projection_transform.times(program_state.view_transform).times(model_transform);
            gl.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false, Matrix.column_major(PVM));
            gl.uniform1f(gpu_addresses.animation_time, program_state.animation_time / 1000);
        }

        vertex_glsl_code() {
            return `#version 300 es
                precision mediump float;
                in vec3 position;
                in vec2 texture_coord;
                uniform mat4 projection_camera_model_transform;
                out vec2 f_tex_coord;

                void main() {
                    gl_Position = projection_camera_model_transform * vec4(position, 1.0);
                    f_tex_coord = texture_coord;
                }`;
        }

        fragment_glsl_code() {
            return `#version 300 es
                precision mediump float;
                in vec2 f_tex_coord;
                uniform float animation_time;
                out vec4 frag_color;

                void main() {
                    float a = animation_time, u = f_tex_coord.x, v = f_tex_coord.y;
                    frag_color = vec4(
                        2.0 * u * sin(17.0 * u) + 3.0 * v * sin(11.0 * v) + 1.0 * sin(13.0 * a),
                        3.0 * u * sin(18.0 * u) + 4.0 * v * sin(12.0 * v) + 2.0 * sin(14.0 * a),
                        4.0 * u * sin(19.0 * u) + 5.0 * v * sin(13.0 * v) + 3.0 * sin(15.0 * a),
                        5.0 * u * sin(20.0 * u) + 6.0 * v * sin(14.0 * v) + 4.0 * sin(16.0 * a));
                }`;
        }
    };


const Phong_Shader = defs.Phong_Shader =
    class Phong_Shader extends Shader {
        // **Phong_Shader** — the Phong reflection model (with Blinn's half vector), evaluated per
        // fragment ("Phong shading").  Before programmable GPUs, lighting like this was built into
        // the hardware.  Material options: color, ambient, diffusivity, specularity, smoothness.
        //
        //   I = color·ambient + Σ_lights attenuation · ( color·light·diffusivity·max(N·L, 0)
        //                                               + light·specularity·max(N·H, 0)^smoothness )
        constructor(num_lights = 2) {
            super();
            this.num_lights = num_lights;
        }

        shared_glsl_code() {
            return `#version 300 es
                precision mediump float;
                precision mediump int;      // vertex and fragment shaders default to different int precisions,
                                            // and a uniform shared by both must match
                const int N_LIGHTS = ${this.num_lights};
                uniform float ambient, diffusivity, specularity, smoothness;
                uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
                uniform float light_attenuation_factors[N_LIGHTS];
                uniform int num_lights_in_use;
                uniform vec4 shape_color;
                uniform vec3 camera_center;

                vec3 phong_model_lights(vec3 N, vec3 vertex_worldspace) {
                    vec3 E = normalize(camera_center - vertex_worldspace);     // toward the eye
                    vec3 result = vec3(0.0);
                    for (int i = 0; i < N_LIGHTS; i++) {
                        if (i >= num_lights_in_use) break;
                        // w = 0: a directional light, the stored xyz already is the direction toward it.
                        // w = 1: a point light, so subtract the surface point to get the direction.
                        vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz
                                                     - light_positions_or_vectors[i].w * vertex_worldspace;
                        float distance_to_light = length(surface_to_light_vector);
                        vec3 L = normalize(surface_to_light_vector);
                        vec3 H = normalize(L + E);
                        float diffuse  = max(dot(N, L), 0.0);
                        float specular = diffuse > 0.0 ? pow(max(dot(N, H), 0.0), smoothness) : 0.0;
                        float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light);
                        vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                + light_colors[i].xyz * specularity * specular;
                        result += attenuation * light_contribution;
                    }
                    return result;
                }`;
        }

        vertex_glsl_code() {
            return this.shared_glsl_code() + `
                in vec3 position, normal;                   // object space
                uniform mat4 model_transform;
                uniform mat4 projection_camera_model_transform;
                uniform mat3 normal_matrix;                 // inverse transpose of model_transform's 3x3
                out vec3 N, vertex_worldspace;

                void main() {
                    gl_Position = projection_camera_model_transform * vec4(position, 1.0);
                    N = normalize(normal_matrix * normal);
                    vertex_worldspace = (model_transform * vec4(position, 1.0)).xyz;
                }`;
        }

        fragment_glsl_code() {
            return this.shared_glsl_code() + `
                in vec3 N, vertex_worldspace;               // interpolated per fragment
                out vec4 frag_color;

                void main() {
                    frag_color = vec4(shape_color.xyz * ambient, shape_color.w);
                    frag_color.xyz += phong_model_lights(normalize(N), vertex_worldspace);
                }`;
        }

        send_material(gl, gpu, material) {
            gl.uniform4fv(gpu.shape_color, material.color);
            gl.uniform1f(gpu.ambient, material.ambient);
            gl.uniform1f(gpu.diffusivity, material.diffusivity);
            gl.uniform1f(gpu.specularity, material.specularity);
            gl.uniform1f(gpu.smoothness, material.smoothness);
        }

        send_gpu_state(gl, gpu, program_state, model_transform) {
            // The eye point is where the camera's own frame puts the origin: camera_transform · (0,0,0,1).
            const camera_center = program_state.camera_transform.times(vec4(0, 0, 0, 1)).to3();
            gl.uniform3fv(gpu.camera_center, camera_center);
            const PVM = program_state.projection_transform.times(program_state.view_transform).times(model_transform);
            gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.column_major(model_transform));
            gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.column_major(PVM));
            gl.uniformMatrix3fv(gpu.normal_matrix, false, Matrix.column_major(Mat4.normal_matrix(model_transform)));

            const lights = (program_state.lights || []).slice(0, this.num_lights);
            if (program_state.lights && program_state.lights.length > this.num_lights)
                tiny.Vertex_Buffer.warn_once(`Phong_Shader(${this.num_lights}) uses only its first ${this.num_lights} lights; ${program_state.lights.length} were given.`);
            gl.uniform1i(gpu.num_lights_in_use, lights.length);
            if (!lights.length) return;
            gl.uniform4fv(gpu.light_positions_or_vectors, lights.flatMap(l => [...l.position]));
            gl.uniform4fv(gpu.light_colors, lights.flatMap(l => [...l.color]));
            gl.uniform1fv(gpu.light_attenuation_factors, lights.map(l => l.attenuation));
        }

        update_GPU(gl, gpu_addresses, program_state, model_transform, material) {
            // Every value the GPU needs comes from the Material (this shape) or the Program_State (the scene).
            // Missing material options fall back to these defaults:
            const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
            material = Object.assign({}, defaults, material);
            this.send_material(gl, gpu_addresses, material);
            this.send_gpu_state(gl, gpu_addresses, program_state, model_transform);
        }
    };


const Textured_Phong = defs.Textured_Phong =
    class Textured_Phong extends Phong_Shader {
        // **Textured_Phong** — Phong_Shader that also samples an image at each fragment's
        // interpolated texture coordinate.  Material option: texture (a Texture or Render_Target).
        vertex_glsl_code() {
            return this.shared_glsl_code() + `
                in vec3 position, normal;
                in vec2 texture_coord;
                uniform mat4 model_transform;
                uniform mat4 projection_camera_model_transform;
                uniform mat3 normal_matrix;
                out vec3 N, vertex_worldspace;
                out vec2 f_tex_coord;

                void main() {
                    gl_Position = projection_camera_model_transform * vec4(position, 1.0);
                    N = normalize(normal_matrix * normal);
                    vertex_worldspace = (model_transform * vec4(position, 1.0)).xyz;
                    f_tex_coord = texture_coord;
                }`;
        }

        fragment_glsl_code() {
            // ("texture" is a built-in GLSL function in ES 3.00, so the sampler is named texture_image.)
            return this.shared_glsl_code() + `
                in vec3 N, vertex_worldspace;
                in vec2 f_tex_coord;
                uniform sampler2D texture_image;
                out vec4 frag_color;

                void main() {
                    vec4 tex_color = texture(texture_image, f_tex_coord);
                    if (tex_color.w < .01) discard;
                    frag_color = vec4((tex_color.xyz + shape_color.xyz) * ambient, shape_color.w * tex_color.w);
                    frag_color.xyz += phong_model_lights(normalize(N), vertex_worldspace);
                }`;
        }

        update_GPU(gl, gpu_addresses, program_state, model_transform, material) {
            super.update_GPU(gl, gpu_addresses, program_state, model_transform, material);
            if (material.texture && material.texture.ready) {
                gl.uniform1i(gpu_addresses.texture_image, 0);     // the sampler reads texture unit 0 ...
                material.texture.activate(gl, 0);                 // ... where we bind this draw's image
            }
        }
    };


const Fake_Bump_Map = defs.Fake_Bump_Map =
    class Fake_Bump_Map extends Textured_Phong {
        // **Fake_Bump_Map** — Textured_Phong, but the normal is nudged by the texture color.  Real bump
        // mapping perturbs the normal along the surface's tangent directions using a height map; this
        // shortcut ignores tangent space, so it only looks right on some surfaces.
        fragment_glsl_code() {
            return this.shared_glsl_code() + `
                in vec3 N, vertex_worldspace;
                in vec2 f_tex_coord;
                uniform sampler2D texture_image;
                out vec4 frag_color;

                void main() {
                    vec4 tex_color = texture(texture_image, f_tex_coord);
                    if (tex_color.w < .01) discard;
                    vec3 bumped_N = N + tex_color.rgb - .5 * vec3(1, 1, 1);
                    frag_color = vec4((tex_color.xyz + shape_color.xyz) * ambient, shape_color.w * tex_color.w);
                    frag_color.xyz += phong_model_lights(normalize(bumped_N), vertex_worldspace);
                }`;
        }
    };

// ═════════════════════════════════════════════════════════════════════════════════════════
// Scenes that help other scenes
// ═════════════════════════════════════════════════════════════════════════════════════════

const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo =
    class Minimal_Webgl_Demo extends Scene {
        // **Minimal_Webgl_Demo** — about the smallest complete Scene: one colored triangle.
        constructor() {
            super();
            this.widget_options = {make_controls: false, show_explanation: false};
            this.shapes = {triangle: new Minimal_Shape()};
            this.shader = new Basic_Shader();
        }

        display(webgl_manager, program_state) {
            this.shapes.triangle.draw(webgl_manager, program_state, Mat4.identity(), new Material(this.shader));
        }
    };


const Movement_Controls = defs.Movement_Controls =
    class Movement_Controls extends Scene {
        // **Movement_Controls** — add as a child scene to fly the camera: WASD / space / z to move,
        // drag on the canvas to orbit, and buttons for preset views.  It edits the camera stored in
        // program_state (or any matrix pair you give set_recipient()).
        constructor() {
            super();
            Object.assign(this, {
                roll: 0, look_around_locked: true,
                thrust: vec3(0, 0, 0), pos: vec3(0, 0, 0), z_axis: vec3(0, 0, 0),
                radians_per_frame: 1 / 200, meters_per_frame: 20, speed_multiplier: 1
            });
            this.mouse_enabled_canvases = new Set();
            this.will_take_over_camera = true;
            // Until the first display() attaches to a real camera, buttons act on a scratch pair.
            const [scratch, scratch_inverse] = [Mat4.identity(), Mat4.identity()];
            this.set_recipient(() => scratch, () => scratch_inverse);
            this.mouse = {"from_center": vec(0, 0)};
        }

        // set_recipient(): track an external pair of matrices, given as closures so they stay live:
        // matrix() is camera → world, inverse() is world → camera.
        set_recipient(matrix_closure, inverse_closure) {
            this.matrix = matrix_closure;
            this.inverse = inverse_closure;
        }

        reset(program_state) {
            this.set_recipient(() => program_state.camera_transform, () => program_state.view_transform);
        }

        add_mouse_controls(canvas) {
            this.mouse = {"from_center": vec(0, 0)};
            const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
                vec(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
            document.addEventListener("pointerup", () => this.mouse.anchor = undefined);
            canvas.addEventListener("pointerdown", e => {
                e.preventDefault();
                this.mouse.anchor = mouse_position(e);
            });
            canvas.addEventListener("pointermove", e => {
                e.preventDefault();
                this.mouse.from_center = mouse_position(e);
            });
            canvas.addEventListener("pointerout", () => {
                if (!this.mouse.anchor) this.mouse.from_center.scale_by(0);
            });
        }

        make_control_panel() {
            this.control_panel.innerHTML += "Drag the canvas to orbit; keys below to fly.<br>";
            this.live_string(box => box.textContent = "Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2)
                + ", " + this.pos[2].toFixed(2));
            this.new_line();
            // The camera looks down its own −z axis, so "facing" reports the opposite of its z axis:
            this.live_string(box => box.textContent = "Facing: " + ((this.z_axis[0] > 0 ? "West " : "East ")
                + (this.z_axis[1] > 0 ? "Down " : "Up ") + (this.z_axis[2] > 0 ? "North" : "South")));
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
            speed_controls.style.margin = "0 12px";
            this.key_triggered_button("−", ["o"], () => this.speed_multiplier /= 1.2, undefined, undefined, undefined, speed_controls);
            this.live_string(box => box.textContent = " speed " + this.speed_multiplier.toFixed(2) + " ", speed_controls);
            this.key_triggered_button("+", ["p"], () => this.speed_multiplier *= 1.2, undefined, undefined, undefined, speed_controls);
            this.new_line();
            this.key_triggered_button("Roll left", [","], () => this.roll = 1, undefined, () => this.roll = 0);
            this.key_triggered_button("Roll right", ["."], () => this.roll = -1, undefined, () => this.roll = 0);
            this.new_line();
            this.key_triggered_button("(Un)freeze mouse look", ["f"], () => this.look_around_locked ^= 1, "#8B8885");
            this.new_line();
            this.key_triggered_button("Go to world origin", ["r"], () => {
                this.matrix().set_identity(4, 4);
                this.inverse().set_identity(4, 4);
            }, "#8B8885");
            this.new_line();
            const look_from = (eye, label, key) => this.key_triggered_button(label, [key], () => {
                this.inverse().set(Mat4.look_at(eye, vec3(0, 0, 0), vec3(0, 1, 0)));
                this.matrix().set(Mat4.inverse(this.inverse()));
            }, "#8B8885");
            look_from(vec3(0, 0, 10), "Look at origin from front", "1");
            this.new_line();
            look_from(vec3(10, 0, 0), "from right", "2");
            look_from(vec3(0, 0, -10), "from rear", "3");
            look_from(vec3(-10, 0, 0), "from left", "4");
            this.new_line();
            this.key_triggered_button("Attach to global camera", ["Shift", "R"], () => this.will_take_over_camera = true, "#8B8885");
        }

        first_person_flyaround(radians_per_frame, meters_per_frame, leeway = 70) {
            const offsets_from_dead_box = {
                plus: [this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway],
                minus: [this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway]
            };
            if (!this.look_around_locked)
                for (let i = 0; i < 2; i++) {
                    const o = offsets_from_dead_box,
                        velocity = ((o.minus[i] > 0 && o.minus[i]) || (o.plus[i] < 0 && o.plus[i])) * radians_per_frame;
                    this.matrix().post_multiply(Mat4.rotation(-velocity, i, 1 - i, 0));
                    this.inverse().pre_multiply(Mat4.rotation(+velocity, i, 1 - i, 0));
                }
            this.matrix().post_multiply(Mat4.rotation(-.1 * this.roll, 0, 0, 1));
            this.inverse().pre_multiply(Mat4.rotation(+.1 * this.roll, 0, 0, 1));
            // Translate in the camera's newest local frame.  A change to one matrix is always mirrored
            // by the inverse change on the other, so the pair stays exact inverses without re-inverting.
            this.matrix().post_multiply(Mat4.translation(...this.thrust.times(-meters_per_frame)));
            this.inverse().pre_multiply(Mat4.translation(...this.thrust.times(+meters_per_frame)));
        }

        third_person_arcball(radians_per_frame) {
            const dragging_vector = this.mouse.from_center.minus(this.mouse.anchor);
            if (dragging_vector.norm() <= 0) return;
            this.matrix().post_multiply(Mat4.translation(0, 0, -25));
            this.inverse().pre_multiply(Mat4.translation(0, 0, +25));
            const rotation = Mat4.rotation(radians_per_frame * dragging_vector.norm(), dragging_vector[1], dragging_vector[0], 0);
            this.matrix().post_multiply(rotation);
            this.inverse().pre_multiply(Mat4.inverse(rotation));
            this.matrix().post_multiply(Mat4.translation(0, 0, +25));
            this.inverse().pre_multiply(Mat4.translation(0, 0, -25));
        }

        display(webgl_manager, program_state, dt = program_state.animation_delta_time / 1000) {
            const m = this.speed_multiplier * this.meters_per_frame,
                r = this.speed_multiplier * this.radians_per_frame;
            if (this.will_take_over_camera) {
                this.reset(program_state);
                this.will_take_over_camera = false;
            }
            if (!this.mouse_enabled_canvases.has(webgl_manager.canvas)) {
                this.add_mouse_controls(webgl_manager.canvas);
                this.mouse_enabled_canvases.add(webgl_manager.canvas);
            }
            this.first_person_flyaround(dt * r, dt * m);
            if (this.mouse.anchor) this.third_person_arcball(dt * r);
            this.pos = this.matrix().times(vec4(0, 0, 0, 1));
            this.z_axis = this.matrix().times(vec4(0, 0, 1, 0));
        }
    };


const Program_State_Viewer = defs.Program_State_Viewer =
    class Program_State_Viewer extends Scene {
        // **Program_State_Viewer** — a child scene with a pause button for animation time.
        make_control_panel() {
            this.program_state = this.program_state || {};
            this.key_triggered_button("(Un)pause animation", ["Alt", "a"], () => this.program_state.animate ^= 1);
        }

        display(webgl_manager, program_state) {
            this.program_state = program_state;
        }
    };
