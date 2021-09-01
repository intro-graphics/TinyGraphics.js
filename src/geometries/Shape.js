import {VertexBuffer} from "../utils.js";
import {Mat4} from "../math/Matrix.js";
import {vec3, Vector3} from "../math/Vector.js";

/**
 ** **Shape** extends VertexBuffer to give it an awareness that it holds data about 3D space.  This class
 * is used the same way as VertexBuffer, by subclassing it and writing a constructor that fills in the
 * "arrays" property with some custom arrays.
 *
 * Shape extends VertexBuffer's functionality for copying shapes into buffers the graphics card's memory,
 * adding the basic assumption that each vertex will have a 3D position and a 3D normal vector as available
 * fields to look up.  This means there will be at least two arrays for the user to fill in:  "positions"
 * enumerating all the vertices' locations, and "normals" enumerating all vertices' normal vectors pointing
 * away from the surface.  Both are of type Vector3.
 *
 * By including  these, Shape adds to class VertexBuffer the ability to compound shapes in together into a
 * single performance-friendly VertexBuffer, placing this shape into a larger one at a custom transforms by
 * adjusting positions and normals with a call to insert_transformed_copy_into().  Compared to VertexBuffer
 * we also gain the ability via flat-shading to compute normals from scratch for a shape that has none, and
 * the ability to eliminate inter-triangle sharing of vertices for any data we want to abruptly vary as we
 * cross over a triangle edge (such as texture images).
 *
 * Like in class VertexBuffer we have an array "indices" to fill in as well, a list of index triples
 * defining which three vertices belong to each triangle.  Call new on a Shape and fill its arrays (probably
 * in an overridden constructor).
 *
 * IMPORTANT: To use this class you must define all fields for every single vertex by filling in the arrays
 * of each field, so this includes positions, normals, any more fields a specific Shape subclass decides to
 * include per vertex, such as texture coordinates.  Be warned that leaving any empty elements in the lists
 * will result in an out of bounds GPU warning (and nothing drawn) whenever the "indices" list contains
 * references to that position in the lists.
 */
class Shape extends VertexBuffer {
    /**
     * For building compound shapes.  A copy of this shape is made
     * and inserted into any recipient shape you pass in.  Compound shapes help reduce draw calls
     * and speed up performance.
     * @param recipient
     * @param args
     * @param points_transform
     */
    static insert_transformed_copy_into(recipient, args, points_transform = Mat4.identity()) {
        // insert_transformed_copy_into():
        // Here if you try to bypass making a temporary shape and instead directly insert new data into
        // the recipient, you'll run into trouble when the recursion tree stops at different depths.
        const temp_shape = new this(...args);
        recipient.indices.push(...temp_shape.indices.map(i => i + recipient.arrays.position.length));
        // Copy each array from temp_shape into the recipient shape:
        for (let a in temp_shape.arrays) {
            // Apply points_transform to all points added during this call:
            if (a === "position" || a === "tangents") {
                recipient.arrays[a].push(...temp_shape.arrays[a].map(p => points_transform.times(p.to4(1)).to3()));

            }
            // Do the same for normals, but use the inverse transpose matrix as math requires:
            else if (a === "normal")
                recipient.arrays[a].push(...temp_shape.arrays[a].map(n =>
                    Mat4.inverse(points_transform.transposed()).times(n.to4(1)).to3()));
            // All other arrays get copied in unmodified:
            else recipient.arrays[a].push(...temp_shape.arrays[a]);
        }
    }

    /**
     *  Auto-generate a new class that re-uses any
     * Shape's points, but with new normals generated from flat shading.
     * @returns {{new(...[*]): {}, prototype: {}}}
     */
    make_flat_shaded_version() {
        let duplicate_the_shared_vertices = this.duplicate_the_shared_vertices;
        let flat_shade = this.flat_shade;
        return class extends this.constructor {
            constructor(...args) {
                super(...args);
                duplicate_the_shared_vertices();
                flat_shade();
            }
        }
    }

    /**
     * Prepare an indexed shape for flat shading if it is not ready -- that is, if there are any
     * edges where the same vertices are indexed by both the adjacent triangles, and those two
     * triangles are not co-planar.  The two would therefore fight over assigning different normal
     * vectors to the shared vertices.
     */
    duplicate_the_shared_vertices() {
        const arrays = {};
        console.log(this.arrays)
        for (let arr in this.arrays) arrays[arr] = [];
        for (let index of this.indices)
            for (let arr in this.arrays)
                arrays[arr].push(this.arrays[arr][index]);
        // Make re-arranged versions of each data field, with
        Object.assign(this.arrays, arrays);
        // copied values every time an index was formerly re-used.
        this.indices = this.indices.map((x, i) => i);
        // Without shared vertices, we can use sequential numbering.
    }

    /**
     * Automatically assign the correct normals to each triangular element to achieve flat shading.
     * Affect all recently added triangles (those past "offset" in the list).  Assumes that no
     * vertices are shared across seams.   First, iterate through the index or position triples:
     */
    flat_shade() {
        for (let counter = 0; counter < (this.indices ? this.indices.length : this.arrays.position.length); counter += 3) {
            const indices = this.indices.length ? [this.indices[counter], this.indices[counter + 1], this.indices[counter + 2]]
                : [counter, counter + 1, counter + 2];
            const [p1, p2, p3] = indices.map(i => this.arrays.position[i]);
            // Cross the two edge vectors of this triangle together to get its normal:
            const n1 = p1.minus(p2).cross(p3.minus(p1)).normalized();
            // Flip the normal if adding it to the triangle brings it closer to the origin:
            if (n1.times(.1).plus(p1).norm() < p1.norm()) n1.scale_by(-1);
            // Propagate this normal to the 3 vertices:
            for (let i of indices) this.arrays.normal[i] = Vector3.from(n1);
        }
    }

    normalize_positions(keep_aspect_ratios = true) {
        let p_arr = this.arrays.position;
        const average_position = p_arr.reduce((acc, p) => acc.plus(p.times(1 / p_arr.length)),
            vec3(0, 0, 0));
        p_arr = p_arr.map(p => p.minus(average_position));           // Center the point cloud on the origin.
        const average_lengths = p_arr.reduce((acc, p) =>
            acc.plus(p.map(x => Math.abs(x)).times(1 / p_arr.length)), vec3(0, 0, 0));
        if (keep_aspect_ratios) {
            // Divide each axis by its average distance from the origin.
            this.arrays.position = p_arr.map(p => p.map((x, i) => x / average_lengths[i]));
        } else
            this.arrays.position = p_arr.map(p => p.times(1 / average_lengths.norm()));
    }
}

export {Shape}