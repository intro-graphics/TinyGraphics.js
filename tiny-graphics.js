/**
 * @file A file that shows how to organize a complete graphics program.
 * It wraps common WebGL commands and math.
 * The file tiny-graphics-widgets.js additionally wraps web page interactions.  By Garett.
 *
 * This file will consist of a number of class definitions that we will
 * export.  To organize the exports, we will both declare each class in
 * local scope (const) as well as store them in this JS object:
 *
 * Organization of this file:  Math definitions, then graphics definitions.
 *
 * Vector and Matrix algebra are not built into JavaScript at first.  We will add it now.
 *
 * You will be able to declare a 3D vector [x,y,z] supporting various common vector operations
 * with syntax:  vec(x,y), vec3( x,y,z ) or vec4( x,y,z, zero or one ).  For general sized vectors, use
 * class Vector and declare them with standard Array-supported operations like .of().
 *
 * For matrices, you will use class Mat4 to generate the 4 by 4 matrices that are common
 * in graphics, or for general sized matrices you can use class Matrix.
 *
 * To get vector algebra that performs well in JavaScript, we based class Vector on consecutive
 * buffers (using type Float32Array).  Implementations should specialize for common vector
 * sizes 3 and 4 since JavaScript engines can better optimize functions when they can predict
 * argument count.  Implementations should also avoid allocating new array objects since these
 * will all have to be garbage collected.
 *
 * Examples:
 *  ** For size 3 **
 *     equals: "vec3( 1,0,0 ).equals( vec3( 1,0,0 ) )" returns true.
 *       plus: "vec3( 1,0,0 ).plus  ( vec3( 1,0,0 ) )" returns the Vector [ 2,0,0 ].
 *      minus: "vec3( 1,0,0 ).minus ( vec3( 1,0,0 ) )" returns the Vector [ 0,0,0 ].
 * mult-pairs: "vec3( 1,2,3 ).mult_pairs( vec3( 3,2,0 ) )" returns the Vector [ 3,4,0 ].
 *      scale: "vec3( 1,2,3 ).scale( 2 )" overwrites the Vector with [ 2,4,6 ].
 *      times: "vec3( 1,2,3 ).times( 2 )" returns the Vector [ 2,4,6 ].
 * randomized: Returns this Vector plus a random vector of a given maximum length.
 *        mix: "vec3( 0,2,4 ).mix( vec3( 10,10,10 ), .5 )" returns the Vector [ 5,6,7 ].
 *       norm: "vec3( 1,2,3 ).norm()" returns the square root of 15.
 * normalized: "vec3( 4,4,4 ).normalized()" returns the Vector [ sqrt(3), sqrt(3), sqrt(3) ]
 *  normalize: "vec3( 4,4,4 ).normalize()" overwrites the Vector with [ sqrt(3), sqrt(3), sqrt(3) ].
 *        dot: "vec3( 1,2,3 ).dot( vec3( 1,2,3 ) )" returns 15.
 *       cast: "vec3.cast( [-1,-1,0], [1,-1,0], [-1,1,0] )" converts a list of Array literals into a list of vec3's.
 *        to4: "vec3( 1,2,3 ).to4( true or false )" returns the homogeneous vec4 [ 1,2,3, 1 or 0 ].
 *      cross: "vec3( 1,0,0 ).cross( vec3( 0,1,0 ) )" returns the Vector [ 0,0,1 ].  Use only on 3x1 Vecs.
 *  to_string: "vec3( 1,2,3 ).to_string()" returns "[vec3 1, 2, 3]"
 *  ** For size 4, same except: **
 *        to3: "vec4( 4,3,2,1 ).to3()" returns the vec3 [ 4,3,2 ].  Use to truncate vec4 to vec3.
 *  ** To assign by value **
 *       copy: "let new_vector = old_vector.copy()" assigns by value so you get a different vector object.
 *  ** For any size **
 * to declare: Vector.of( 1,2,3,4,5,6,7,8,9,10 ) returns a Vector filled with those ten entries.
 *  ** For multiplication by matrices **
 *             "any_mat4.times( vec4( 1,2,3,0 ) )" premultiplies the homogeneous Vector [1,2,3]
 *              by the 4x4 matrix and returns the new vec4.  Requires a vec4 as input.
 */

// export const tiny = {};

// /**
//  * **Vector** stores vectors of floating point numbers.  Puts vector math into JavaScript.
//  * @Note  Vectors should be created with of() due to wierdness with the TypedArray spec.
//  * @Tip Assign Vectors with .copy() to avoid referring two variables to the same Vector object.
//  * @type {tiny.Vector}
//  */
// const Vector = tiny.Vector =
//     class Vector extends Float32Array {
//         static create(...arr) {
//             return new Vector(arr);
//         }
//
//         // cast(): For compact syntax when declaring lists.
//         static cast(...args) {
//             return args.map(x => Vector.from(x))
//         }
//
//         copy() {
//             return new Vector(this)
//         }
//
//         equals(b) {
//             return this.every((x, i) => x == b[i])
//         }
//
//         plus(b) {
//             return this.map((x, i) => x + b[i])
//         }
//
//         minus(b) {
//             return this.map((x, i) => x - b[i])
//         }
//
//         times_pairwise(b) {
//             return this.map((x, i) => x * b[i])
//         }
//
//         scale_by(s) {
//             this.forEach((x, i, a) => a[i] *= s)
//         }
//
//         times(s) {
//             return this.map(x => s * x)
//         }
//
//         randomized(s) {
//             return this.map(x => x + s * (Math.random() - .5))
//         }
//
//         mix(b, s) {
//             return this.map((x, i) => (1 - s) * x + s * b[i])
//         }
//
//         norm() {
//             return Math.sqrt(this.dot(this))
//         }
//
//         normalized() {
//             return this.times(1 / this.norm())
//         }
//
//         normalize() {
//             this.scale_by(1 / this.norm())
//         }
//
//         dot(b) {
//             // Optimize for Vectors of size 2
//             if (this.length == 2)
//                 return this[0] * b[0] + this[1] * b[1];
//             return this.reduce((acc, x, i) => {
//                 return acc + x * b[i];
//             }, 0);
//         }
//
//         // to3() / to4() / cross():  For standardizing the API with Vector3/Vector4,
//         // so the performance hit of changing between these types can be measured.
//         to3() {
//             return vec3(this[0], this[1], this[2]);
//         }
//
//         to4(is_a_point) {
//             return vec4(this[0], this[1], this[2], +is_a_point);
//         }
//
//         cross(b) {
//             return vec3(this[1] * b[2] - this[2] * b[1],
//                 this[2] * b[0] - this[0] * b[2],
//                 this[0] * b[1] - this[1] * b[0]);
//         }
//
//         to_string() {
//             return "[vector " + this.join(", ") + "]"
//         }
//     }
//
//
// const Vector3 = tiny.Vector3 =
//     class Vector3 extends Float32Array {
//         // **Vector3** is a specialization of Vector only for size 3, for performance reasons.
//         static create(x, y, z) {
//             const v = new Vector3(3);
//             v[0] = x;
//             v[1] = y;
//             v[2] = z;
//             return v;
//         }
//
//         static cast(...args) {
//             // cast(): Converts a bunch of arrays into a bunch of vec3's.
//             return args.map(x => Vector3.from(x));
//         }
//
//         static unsafe(x, y, z) {
//             // unsafe(): returns vec3s only meant to be consumed immediately. Aliases into
//             // shared memory, to be overwritten upon next unsafe3 call.  Faster.
//             const shared_memory = vec3(0, 0, 0);
//             Vector3.unsafe = (x, y, z) => {
//                 shared_memory[0] = x;
//                 shared_memory[1] = y;
//                 shared_memory[2] = z;
//                 return shared_memory;
//             }
//             return Vector3.unsafe(x, y, z);
//         }
//
//         copy() {
//             return Vector3.from(this)
//         }
//
//         // In-fix operations: Use these for more readable math expressions.
//         equals(b) {
//             return this[0] == b[0] && this[1] == b[1] && this[2] == b[2]
//         }
//
//         plus(b) {
//             return vec3(this[0] + b[0], this[1] + b[1], this[2] + b[2])
//         }
//
//         minus(b) {
//             return vec3(this[0] - b[0], this[1] - b[1], this[2] - b[2])
//         }
//
//         times(s) {
//             return vec3(this[0] * s, this[1] * s, this[2] * s)
//         }
//
//         times_pairwise(b) {
//             return vec3(this[0] * b[0], this[1] * b[1], this[2] * b[2])
//         }
//
//         // Pre-fix operations: Use these for better performance (to avoid new allocation).
//         add_by(b) {
//             this[0] += b[0];
//             this[1] += b[1];
//             this[2] += b[2]
//         }
//
//         subtract_by(b) {
//             this[0] -= b[0];
//             this[1] -= b[1];
//             this[2] -= b[2]
//         }
//
//         scale_by(s) {
//             this[0] *= s;
//             this[1] *= s;
//             this[2] *= s
//         }
//
//         scale_pairwise_by(b) {
//             this[0] *= b[0];
//             this[1] *= b[1];
//             this[2] *= b[2]
//         }
//
//         // Other operations:
//         randomized(s) {
//             return vec3(this[0] + s * (Math.random() - .5),
//                 this[1] + s * (Math.random() - .5),
//                 this[2] + s * (Math.random() - .5));
//         }
//
//         mix(b, s) {
//             return vec3((1 - s) * this[0] + s * b[0],
//                 (1 - s) * this[1] + s * b[1],
//                 (1 - s) * this[2] + s * b[2]);
//         }
//
//         norm() {
//             return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2])
//         }
//
//         normalized() {
//             const d = 1 / this.norm();
//             return vec3(this[0] * d, this[1] * d, this[2] * d);
//         }
//
//         normalize() {
//             const d = 1 / this.norm();
//             this[0] *= d;
//             this[1] *= d;
//             this[2] *= d;
//         }
//
//         dot(b) {
//             return this[0] * b[0] + this[1] * b[1] + this[2] * b[2]
//         }
//
//         cross(b) {
//             return vec3(this[1] * b[2] - this[2] * b[1],
//                 this[2] * b[0] - this[0] * b[2],
//                 this[0] * b[1] - this[1] * b[0])
//         }
//
//         to4(is_a_point)
//         // to4():  Convert to a homogeneous vector of 4 values.
//         {
//             return vec4(this[0], this[1], this[2], +is_a_point)
//         }
//
//         to_string() {
//             return "[vec3 " + this.join(", ") + "]"
//         }
//     }
//
// const Vector4 = tiny.Vector4 =
//     class Vector4 extends Float32Array {
//         // **Vector4** is a specialization of Vector only for size 4, for performance reasons.
//         // The fourth coordinate value is homogenized (0 for a vector, 1 for a point).
//         static create(x, y, z, w) {
//             const v = new Vector4(4);
//             v[0] = x;
//             v[1] = y;
//             v[2] = z;
//             v[3] = w;
//             return v;
//         }
//
//         static unsafe(x, y, z, w) {
//             // **unsafe** Returns vec3s to be used immediately only. Aliases into
//             // shared memory to be overwritten on next unsafe3 call.  Faster.
//             const shared_memory = vec4(0, 0, 0, 0);
//             Vec4.unsafe = (x, y, z, w) => {
//                 shared_memory[0] = x;
//                 shared_memory[1] = y;
//                 shared_memory[2] = z;
//                 shared_memory[3] = w;
//             }
//         }
//
//         copy() {
//             return Vector4.from(this)
//         }
//
//         // In-fix operations: Use these for more readable math expressions.
//         equals(b) {
//             return this[0] == b[0] && this[1] == b[1] && this[2] == b[2] && this[3] == b[3]
//         }
//
//         plus(b) {
//             return vec4(this[0] + b[0], this[1] + b[1], this[2] + b[2], this[3] + b[3])
//         }
//
//         minus(b) {
//             return vec4(this[0] - b[0], this[1] - b[1], this[2] - b[2], this[3] - b[3])
//         }
//
//         times(s) {
//             return vec4(this[0] * s, this[1] * s, this[2] * s, this[3] * s)
//         }
//
//         times_pairwise(b) {
//             return vec4(this[0] * b[0], this[1] * b[1], this[2] * b[2], this[3] * b[3])
//         }
//
//         // Pre-fix operations: Use these for better performance (to avoid new allocation).
//         add_by(b) {
//             this[0] += b[0];
//             this[1] += b[1];
//             this[2] += b[2];
//             this[3] += b[3]
//         }
//
//         subtract_by(b) {
//             this[0] -= b[0];
//             this[1] -= b[1];
//             this[2] -= b[2];
//             this[3] -= b[3]
//         }
//
//         scale_by(s) {
//             this[0] *= s;
//             this[1] *= s;
//             this[2] *= s;
//             this[3] *= s
//         }
//
//         scale_pairwise_by(b) {
//             this[0] *= b[0];
//             this[1] *= b[1];
//             this[2] *= b[2];
//             this[3] *= b[3]
//         }
//
//         // Other operations:
//         randomized(s) {
//             return vec4(this[0] + s * (Math.random() - .5),
//                 this[1] + s * (Math.random() - .5),
//                 this[2] + s * (Math.random() - .5),
//                 this[3] + s * (Math.random() - .5));
//         }
//
//         mix(b, s) {
//             return vec4((1 - s) * this[0] + s * b[0],
//                 (1 - s) * this[1] + s * b[1],
//                 (1 - s) * this[2] + s * b[2],
//                 (1 - s) * this[3] + s * b[3]);
//         }
//
//         norm() {
//             // The norms should behave like for Vector3 because of the homogenous format.
//             return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2])
//         }
//
//         normalized() {
//             const d = 1 / this.norm();
//             return vec4(this[0] * d, this[1] * d, this[2] * d, this[3]);
//             // (leaves the 4th coord alone)
//         }
//
//         normalize() {
//             const d = 1 / this.norm();
//             this[0] *= d;
//             this[1] *= d;
//             this[2] *= d;
//             // (leaves the 4th coord alone)
//         }
//
//         dot(b) {
//             return this[0] * b[0] + this[1] * b[1] + this[2] * b[2] + this[3] * b[3]
//         }
//
//         to3() {
//             return vec3(this[0], this[1], this[2])
//         }
//
//         to_string() {
//             return "[vec4 " + this.join(", ") + "]"
//         }
//     }
//
// const vec = tiny.vec = Vector.create;
// const vec3 = tiny.vec3 = Vector3.create;
// const vec4 = tiny.vec4 = Vector4.create;
// const unsafe3 = tiny.unsafe3 = Vector3.unsafe;
// const unsafe4 = tiny.unsafe4 = Vector4.unsafe;

// // **Color** is an alias for class Vector4.  Colors should be made as special 4x1
// // vectors expressed as ( red, green, blue, opacity ) each ranging from 0 to 1.
// const Color = tiny.Color =
//     class Color extends Vector4 {
//         // Create color from RGBA floats
//         static create_from_float(r, g, b, a) {
//             const v = new Vector4(4);
//             v[0] = r;
//             v[1] = g;
//             v[2] = b;
//             v[3] = a;
//             return v;
//         }
//
//         // Create color from hexadecimal numbers, e.g., #FFFFFF
//         static create_from_hex(hex, alpha = 1.) {
//             const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//             const v = new Vector4(4);
//             if (result) {
//                 v[0] = parseInt(result[1], 16) / 255.;
//                 v[1] = parseInt(result[2], 16) / 255.;
//                 v[2] = parseInt(result[3], 16) / 255.;
//                 v[3] = alpha;
//             }
//             return v;
//         }
//     }
//
// const color = tiny.color = Color.create_from_float;
// const hex_color = tiny.hex_color = Color.create_from_hex;

// const Matrix = tiny.Matrix =
//     class Matrix extends Array {
//         // **Matrix** holds M by N matrices of floats.  Enables matrix and vector math.
//         // Example usage:
//         //  "Matrix( rows )" returns a Matrix with those rows, where rows is an array of float arrays.
//         //  "M.setIdentity( m, n )" assigns the m by n identity to Matrix M.
//         //  "M.subBlock( start, end )" where start and end are each a [ row, column ] pair returns a sub-rectangle cut out from M.
//         //  "M.copy()" creates a deep copy of M and returns it so you can modify it without affecting the original.
//         //  "M.equals(b)", "M.plus(b)", and "M.minus(b)" are operations betwen two matrices.
//         //  "M.transposed()" returns a new matrix where all rows of M became columns and vice versa.
//         //  "M.times(b)" (where the post-multiplied b can be a scalar, a Vector4, or another Matrix) returns a
//         //               new Matrix or Vector4 holding the product.
//         //  "M.pre_multiply(b)"  overwrites the Matrix M with the product of b * M where b must be another Matrix.
//         //  "M.postMultiply(b)" overwrites the Matrix M with the product of M * b where b can be a Matrix or scalar.
//         //  "Matrix.flatten2dTo1D( M )" flattens input (a Matrix or any array of Vectors or float arrays)
//         //                                 into a row-major 1D array of raw floats.
//         //  "M.to_string()" where M contains the 4x4 identity returns "[[1, 0, 0, 0] [0, 1, 0, 0] [0, 0, 1, 0] [0, 0, 0, 1]]".
//
//         constructor(...args) {
//             super(0);
//             this.push(...args)
//         }
//
//         static flatten2dTo1D(M) {
//             let index = 0, floats = new Float32Array(M.length && M.length * M[0].length);
//             for (let i = 0; i < M.length; i++) for (let j = 0; j < M[i].length; j++) floats[index++] = M[i][j];
//             return floats;
//         }
//
//         set(M) {
//             this.length = 0;
//             this.push(...M);
//         }
//
//         setIdentity(m, n) {
//             this.length = 0;
//             for (let i = 0; i < m; i++) {
//                 this.push(Array(n).fill(0));
//                 if (i < n) this[i][i] = 1;
//             }
//         }
//
//         subBlock(start, end) {
//             return Matrix.from(this.slice(start[0], end[0]).map(r => r.slice(start[1], end[1])));
//         }
//
//         copy() {
//             return this.map(r => [...r])
//         }
//
//         equals(b) {
//             return this.every((r, i) => r.every((x, j) => x == b[i][j]))
//         }
//
//         plus(b) {
//             return this.map((r, i) => r.map((x, j) => x + b[i][j]))
//         }
//
//         minus(b) {
//             return this.map((r, i) => r.map((x, j) => x - b[i][j]))
//         }
//
//         transposed() {
//             return this.map((r, i) => r.map((x, j) => this[j][i]))
//         }
//
//         times(b, optional_preallocated_result) {
//             const len = b.length;
//             if (typeof len === "undefined") return this.map(r => r.map(x => b * x));
//             // Matrix * scalar case.
//             const len2 = b[0].length;
//             if (typeof len2 === "undefined") {
//                 let result = optional_preallocated_result || new Vector4(this.length);
//                 // Matrix * Vector4 case.
//                 for (let r = 0; r < len; r++) result[r] = b.dot(this[r]);
//                 return result;
//             }
//             let result = optional_preallocated_result || Matrix.from(new Array(this.length));
//             for (let r = 0; r < this.length; r++) {
//                 // Matrix * Matrix case.
//                 if (!optional_preallocated_result)
//                     result[r] = new Array(len2);
//                 for (let c = 0, sum = 0; c < len2; c++) {
//                     result[r][c] = 0;
//                     for (let r2 = 0; r2 < len; r2++)
//                         result[r][c] += this[r][r2] * b[r2][c];
//                 }
//             }
//             return result;
//         }
//
//         pre_multiply(b) {
//             const new_value = b.times(this);
//             this.length = 0;
//             this.push(...new_value);
//             return this;
//         }
//
//         postMultiply(b) {
//             const new_value = this.times(b);
//             this.length = 0;
//             this.push(...new_value);
//             return this;
//         }
//
//         to_string() {
//             return "[" + this.map((r, i) => "[" + r.join(", ") + "]").join(" ") + "]"
//         }
//     }
//
//
// const Mat4 = tiny.Mat4 =
//     class Mat4 extends Matrix {
//         // **Mat4** generates special 4x4 matrices that are useful for graphics.
//         // All the methods below return a certain 4x4 matrix.
//         static identity() {
//             return Matrix.of([1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]);
//         };
//
//         static rotation(angle, x, y, z) {
//             // rotation(): Requires a scalar (angle) and a three-component axis vector.
//             const normalize = (x, y, z) => {
//                 const n = Math.sqrt(x * x + y * y + z * z);
//                 return [x / n, y / n, z / n]
//             }
//             let [i, j, k] = normalize(x, y, z),
//                 [c, s] = [Math.cos(angle), Math.sin(angle)],
//                 omc = 1.0 - c;
//             return Matrix.of([i * i * omc + c, i * j * omc - k * s, i * k * omc + j * s, 0],
//                 [i * j * omc + k * s, j * j * omc + c, j * k * omc - i * s, 0],
//                 [i * k * omc - j * s, j * k * omc + i * s, k * k * omc + c, 0],
//                 [0, 0, 0, 1]);
//         }
//
//         static scale(x, y, z) {
//             // scale(): Builds and returns a scale matrix using x,y,z.
//             return Matrix.of([x, 0, 0, 0],
//                 [0, y, 0, 0],
//                 [0, 0, z, 0],
//                 [0, 0, 0, 1]);
//         }
//
//         static translation(x, y, z) {
//             // translation(): Builds and returns a translation matrix using x,y,z.
//             return Matrix.of([1, 0, 0, x],
//                 [0, 1, 0, y],
//                 [0, 0, 1, z],
//                 [0, 0, 0, 1]);
//         }
//
//         static look_at(eye, at, up) {
//             // look_at():  Produce a traditional graphics camera "lookat" matrix.
//             // Each input must be a 3x1 Vector.
//             // Note:  look_at() assumes the result will be used for a camera and stores its
//             // result in inverse space.
//             // If you want to use look_at to point a non-camera towards something, you can
//             // do so, but to generate the correct basis you must re-invert its result.
//
//             // Compute vectors along the requested coordinate axes. "y" is the "updated" and orthogonalized local y axis.
//             let z = at.minus(eye).normalized(),
//                 x = z.cross(up).normalized(),
//                 y = x.cross(z).normalized();
//
//             // Check for NaN, indicating a degenerate cross product, which
//             // happens if eye == at, or if at minus eye is parallel to up.
//             if (!x.every(i => i == i))
//                 throw "Two parallel vectors were given";
//             z.scale_by(-1);                               // Enforce right-handed coordinate system.
//             return Mat4.translation(-x.dot(eye), -y.dot(eye), -z.dot(eye))
//                 .times(Matrix.of(x.to4(0), y.to4(0), z.to4(0), vec4(0, 0, 0, 1)));
//         }
//
//         static orthographic(left, right, bottom, top, near, far) {
//             // orthographic(): Box-shaped view volume for projection.
//             return Mat4.scale(vec3(1 / (right - left), 1 / (top - bottom), 1 / (far - near)))
//                 .times(Mat4.translation(vec3(-left - right, -top - bottom, -near - far)))
//                 .times(Mat4.scale(vec3(2, 2, -2)));
//         }
//
//         static perspective(fov_y, aspect, near, far) {
//             // perspective(): Frustum-shaped view volume for projection.
//             const f = 1 / Math.tan(fov_y / 2), d = far - near;
//             return Matrix.of([f / aspect, 0, 0, 0],
//                 [0, f, 0, 0],
//                 [0, 0, -(near + far) / d, -2 * near * far / d],
//                 [0, 0, -1, 0]);
//         }
//
//         static inverse(m) {
//             // inverse(): A 4x4 inverse.  Computing it is slow because of
//             // the amount of steps; call fewer times when possible.
//             const result = Mat4.identity(), m00 = m[0][0], m01 = m[0][1], m02 = m[0][2], m03 = m[0][3],
//                 m10 = m[1][0], m11 = m[1][1], m12 = m[1][2], m13 = m[1][3],
//                 m20 = m[2][0], m21 = m[2][1], m22 = m[2][2], m23 = m[2][3],
//                 m30 = m[3][0], m31 = m[3][1], m32 = m[3][2], m33 = m[3][3];
//             result[0][0] = m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33;
//             result[0][1] = m03 * m22 * m31 - m02 * m23 * m31 - m03 * m21 * m32 + m01 * m23 * m32 + m02 * m21 * m33 - m01 * m22 * m33;
//             result[0][2] = m02 * m13 * m31 - m03 * m12 * m31 + m03 * m11 * m32 - m01 * m13 * m32 - m02 * m11 * m33 + m01 * m12 * m33;
//             result[0][3] = m03 * m12 * m21 - m02 * m13 * m21 - m03 * m11 * m22 + m01 * m13 * m22 + m02 * m11 * m23 - m01 * m12 * m23;
//             result[1][0] = m13 * m22 * m30 - m12 * m23 * m30 - m13 * m20 * m32 + m10 * m23 * m32 + m12 * m20 * m33 - m10 * m22 * m33;
//             result[1][1] = m02 * m23 * m30 - m03 * m22 * m30 + m03 * m20 * m32 - m00 * m23 * m32 - m02 * m20 * m33 + m00 * m22 * m33;
//             result[1][2] = m03 * m12 * m30 - m02 * m13 * m30 - m03 * m10 * m32 + m00 * m13 * m32 + m02 * m10 * m33 - m00 * m12 * m33;
//             result[1][3] = m02 * m13 * m20 - m03 * m12 * m20 + m03 * m10 * m22 - m00 * m13 * m22 - m02 * m10 * m23 + m00 * m12 * m23;
//             result[2][0] = m11 * m23 * m30 - m13 * m21 * m30 + m13 * m20 * m31 - m10 * m23 * m31 - m11 * m20 * m33 + m10 * m21 * m33;
//             result[2][1] = m03 * m21 * m30 - m01 * m23 * m30 - m03 * m20 * m31 + m00 * m23 * m31 + m01 * m20 * m33 - m00 * m21 * m33;
//             result[2][2] = m01 * m13 * m30 - m03 * m11 * m30 + m03 * m10 * m31 - m00 * m13 * m31 - m01 * m10 * m33 + m00 * m11 * m33;
//             result[2][3] = m03 * m11 * m20 - m01 * m13 * m20 - m03 * m10 * m21 + m00 * m13 * m21 + m01 * m10 * m23 - m00 * m11 * m23;
//             result[3][0] = m12 * m21 * m30 - m11 * m22 * m30 - m12 * m20 * m31 + m10 * m22 * m31 + m11 * m20 * m32 - m10 * m21 * m32;
//             result[3][1] = m01 * m22 * m30 - m02 * m21 * m30 + m02 * m20 * m31 - m00 * m22 * m31 - m01 * m20 * m32 + m00 * m21 * m32;
//             result[3][2] = m02 * m11 * m30 - m01 * m12 * m30 - m02 * m10 * m31 + m00 * m12 * m31 + m01 * m10 * m32 - m00 * m11 * m32;
//             result[3][3] = m01 * m12 * m20 - m02 * m11 * m20 + m02 * m10 * m21 - m00 * m12 * m21 - m01 * m10 * m22 + m00 * m11 * m22;
//             // Divide by determinant and return.
//             return result.times(1 / (m00 * result[0][0] + m10 * result[0][1] + m20 * result[0][2] + m30 * result[0][3]));
//         }
//     }


// const KeyboardManager = tiny.KeyboardManager =
    // class KeyboardManager {
    //     // **KeyboardManager** maintains a running list of which keys are depressed.  You can map combinations of
    //     // shortcut keys to trigger callbacks you provide by calling add().  See add()'s arguments.  The shortcut
    //     // list is indexed by convenient strings showing each bound shortcut combination.  The constructor
    //     // optionally takes "target", which is the desired DOM element for keys to be pressed inside of, and
    //     // "callbackBehavior", which will be called for every key action and allows extra behavior on each event
    //     // -- giving an opportunity to customize their bubbling, preventDefault, and more.  It defaults to no
    //     // additional behavior besides the callback itself on each assigned key action.
    //     constructor(target = document, callbackBehavior = (callback, event) => callback(event)) {
    //         this.saved_controls = {};
    //         this.actively_pressed_keys = new Set();
    //         this.callbackBehavior = callbackBehavior;
    //         target.addEventListener("keydown", this.key_down_handler.bind(this));
    //         target.addEventListener("keyup", this.key_up_handler.bind(this));
    //         window.addEventListener("focus", () => this.actively_pressed_keys.clear());
    //         // Deal with stuck keys during focus change.
    //     }
    //
    //     key_down_handler(event) {
    //         if (["INPUT", "TEXTAREA"].includes(event.target.tagName))
    //             return;
    //         // Don't interfere with typing.
    //         this.actively_pressed_keys.add(event.key);
    //         // Track the pressed key.
    //         for (let saved of Object.values(this.saved_controls)) {
    //             // Re-check all the keydown handlers.
    //             if (saved.shortcutCombination.every(s => this.actively_pressed_keys.has(s))
    //                 && event.ctrlKey == saved.shortcutCombination.includes("Control")
    //                 && event.shiftKey == saved.shortcutCombination.includes("Shift")
    //                 && event.altKey == saved.shortcutCombination.includes("Alt")
    //                 && event.metaKey == saved.shortcutCombination.includes("Meta"))
    //                 // Modifiers must exactly match.
    //                 this.callbackBehavior(saved.callback, event);
    //             // The keys match, so fire the callback.
    //         }
    //     }
    //
    //     key_up_handler(event) {
    //         const lower_symbols = "qwertyuiopasdfghjklzxcvbnm1234567890-=[]\\;',./",
    //             upper_symbols = "QWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*()_+{}|:\"<>?";
    //
    //         const lifted_key_symbols = [event.key, upper_symbols[lower_symbols.indexOf(event.key)],
    //             lower_symbols[upper_symbols.indexOf(event.key)]];
    //         // Call keyup for any shortcuts
    //         for (let saved of Object.values(this.saved_controls))                          // that depended on the released
    //             if (lifted_key_symbols.some(s => saved.shortcutCombination.includes(s)))  // key or its shift-key counterparts.
    //                 this.callbackBehavior(saved.keyup_callback, event);                  // The keys match, so fire the callback.
    //         lifted_key_symbols.forEach(k => this.actively_pressed_keys.delete(k));
    //     }
    //
    //     add(shortcutCombination, callback = () => {
    //     }, keyup_callback = () => {
    //     }) {                                 // add(): Creates a keyboard operation.  The argument shortcutCombination wants an
    //         // array of strings that follow standard KeyboardEvent key names. Both the keyup
    //         // and keydown callbacks for any key combo are optional.
    //         this.saved_controls[shortcutCombination.join('+')] = {shortcutCombination, callback, keyup_callback};
    //     }
    // }


// const GraphicsCardObject = tiny.GraphicsCardObject =
//     class GraphicsCardObject {
//         // ** GraphicsCardObject** Extending this base class allows an object to
//         // copy itself onto a WebGL context on demand, whenever it is first used for
//         // a GPU draw command on a context it hasn't seen before.
//         constructor() {
//             this.gpu_instances = new Map()
//         }     // Track which GPU contexts this object has copied itself onto.
//         copyOntoGraphicsCard(context, intial_gpu_representation) {
//             // copyOntoGraphicsCard():  Our object might need to register to multiple
//             // GPU contexts in the case of multiple drawing areas.  If this is a new GPU
//             // context for this object, copy the object to the GPU.  Otherwise, this
//             // object already has been copied over, so get a pointer to the existing
//             // instance.  The instance consists of whatever GPU pointers are associated
//             // with this object, as returned by the WebGL calls that copied it to the
//             // GPU.  GPU-bound objects should override this function, which builds an
//             // initial instance, so as to populate it with finished pointers.
//             const existing_instance = this.gpu_instances.get(context);
//
//             // Warn the user if they are avoidably making too many GPU objects.  Beginner
//             // WebGL programs typically only need to call copyOntoGraphicsCard once
//             // per object; doing it more is expensive, so warn them with an "idiot
//             // alarm". Don't trigger the idiot alarm if the user is correctly re-using
//             // an existing GPU context and merely overwriting parts of itself.
//             if (!existing_instance) {
//                 GraphicsCardObject.idiot_alarm |= 0;     // Start a program-wide counter.
//                 if (GraphicsCardObject.idiot_alarm++ > 200)
//                     throw `Error: You are sending a lot of object definitions to the GPU, probably by mistake!
//                     Many of them are likely duplicates, which you don't want since sending each one is very slow.
//                     To avoid this, from your display() function avoid ever declaring a Shape Shader or Texture (or
//                     subclass of these) with "new", thus causing the definition to be re-created and re-transmitted every
//                     frame. Instead, call these in your scene's constructor and keep the result as a class member,
//                     or otherwise make sure it only happens once.  In the off chance that you have a somehow deformable
//                     shape that MUST change every frame, then at least use the special arguments of
//                     copyOntoGraphicsCard to limit which buffers get overwritten every frame to only
//                     the necessary ones.`;
//             }
//             // Check if this object already exists on that GPU context.
//             return existing_instance ||             // If necessary, start a new object associated with the context.
//                 this.gpu_instances.set(context, intial_gpu_representation).get(context);
//         }
//
//         activate(context, ...args) {                            // activate():  To use, super call it to retrieve a container of GPU
//             // pointers associated with this object.  If none existed one will be created.
//             // Then do any WebGL calls you need that require GPU pointers.
//             return this.gpu_instances.get(context) || this.copyOntoGraphicsCard(context, ...args)
//         }
//     }


// const VertexBuffer = tiny.VertexBuffer =
//     class VertexBuffer extends GraphicsCardObject {
//         // **VertexBuffer** organizes data related to one 3D shape and copies it into GPU memory.  That data
//         // is broken down per vertex in the shape.  To use, make a subclass of it that overrides the
//         // constructor and fills in the "arrays" property.  Within "arrays", you can make several fields that
//         // you can look up in a vertex; for each field, a whole array will be made here of that data type and
//         // it will be indexed per vertex.  Along with those lists is an additional array "indices" describing
//         // how vertices are connected to each other into shape primitives.  Primitives could includes
//         // triangles, expressed as triples of vertex indices.
//         constructor(...array_names) {
//             // This superclass constructor expects a list of names of arrays that you plan for.
//             super();
//             [this.arrays, this.indices] = [{}, []];
//             // Initialize a blank array member of the Shape with each of the names provided:
//             for (let name of array_names) this.arrays[name] = [];
//         }
//
//         copyOntoGraphicsCard(context, selectionOfArrays = Object.keys(this.arrays), writeToIndices = true) {
//             // copyOntoGraphicsCard():  Called automatically as needed to load this vertex array set onto
//             // one of your GPU contexts for its first time.  Send the completed vertex and index lists to
//             // their own buffers within any of your existing graphics card contexts.  Optional arguments
//             // allow calling this again to overwrite the GPU buffers related to this shape's arrays, or
//             // subsets of them as needed (if only some fields of your shape have changed).
//
//             // Define what this object should store in each new WebGL Context:
//             const initialGpuRepresentation = {webGL_buffer_pointers: {}};
//             // Our object might need to register to multiple GPU contexts in the case of
//             // multiple drawing areas.  If this is a new GPU context for this object,
//             // copy the object to the GPU.  Otherwise, this object already has been
//             // copied over, so get a pointer to the existing instance.
//             const didExist = this.gpu_instances.get(context);
//             const gpuInstance = super.copyOntoGraphicsCard(context, initialGpuRepresentation);
//
//             const gl = context;
//
//             const write = didExist ? (target, data) => gl.bufferSubData(target, 0, data)
//                 : (target, data) => gl.bufferData(target, data, gl.STATIC_DRAW);
//
//             for (let name of selectionOfArrays) {
//                 if (!didExist)
//                     gpuInstance.webGL_buffer_pointers[name] = gl.createBuffer();
//                 gl.bindBuffer(gl.ARRAY_BUFFER, gpuInstance.webGL_buffer_pointers[name]);
//                 write(gl.ARRAY_BUFFER, Matrix.flatten2dTo1D(this.arrays[name]));
//             }
//             if (this.indices.length && writeToIndices) {
//                 if (!didExist)
//                     gpuInstance.index_buffer = gl.createBuffer();
//                 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuInstance.index_buffer);
//                 write(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));
//             }
//             return gpuInstance;
//         }
//
//         executeShaders(gl, gpuInstance, type)     // executeShaders(): Draws this shape's entire vertex buffer.
//         {       // Draw shapes using indices if they exist.  Otherwise, assume the vertices are arranged as triples.
//             if (this.indices.length) {
//                 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuInstance.index_buffer);
//                 gl.drawElements(gl[type], this.indices.length, gl.UNSIGNED_INT, 0)
//             } else gl.drawArrays(gl[type], 0, Object.values(this.arrays)[0].length);
//         }
//
//         draw(webglManager, programState, model_transform, material, type = "TRIANGLES") {
//             // draw():  To appear onscreen, a shape of any variety goes through this function,
//             // which executes the shader programs.  The shaders draw the right shape due to
//             // pre-selecting the correct buffer region in the GPU that holds that shape's data.
//             const gpuInstance = this.activate(webglManager.context);
//             material.shader.activate(webglManager.context, gpuInstance.webGL_buffer_pointers, programState, model_transform, material);
//             // Run the shaders to draw every triangle now:
//             this.executeShaders(webglManager.context, gpuInstance, type);
//         }
//     }





// const Light = tiny.Light =
//     class Light {
//         // **Light** stores the properties of one light in a scene.  Contains a coordinate and a
//         // color (each are 4x1 Vectors) as well as one size scalar.
//         // The coordinate is homogeneous, and so is either a point or a vector.  Use w=0 for a
//         // vector (directional) light, and w=1 for a point light / spotlight.
//         // For spotlights, a light also needs a "size" factor for how quickly the brightness
//         // should attenuate (reduce) as distance from the spotlight increases.
//         constructor(position, color, size) {
//             Object.assign(this, {position, color, attenuation: 1 / size});
//         }
//     }


// const GraphicsAddresses = tiny.GraphicsAddresses =
//     class GraphicsAddresses {
//         // **GraphicsAddresses** is used internally in Shaders for organizing communication with the GPU.
//         // Once we've compiled the Shader, we can query some things about the compiled program, such as
//         // the memory addresses it will use for uniform variables, and the types and indices of its per-
//         // vertex attributes.  We'll need those for building vertex buffers.
//         constructor(program, gl) {
//             const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
//             for (let i = 0; i < numUniforms; ++i) {
//                 // Retrieve the GPU addresses of each uniform variable in the shader
//                 // based on their names, and store these pointers for later.
//                 let u = gl.getActiveUniform(program, i).name.split('[')[0];
//                 this[u] = gl.getUniformLocation(program, u);
//             }
//
//             this.shader_attributes = {};
//             // Assume per-vertex attributes will each be a set of 1 to 4 floats:
//             const typeToSizeMapping = {0x1406: 1, 0x8B50: 2, 0x8B51: 3, 0x8B52: 4};
//             const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
//             for (let i = 0; i < numAttribs; i++) {
//                 // https://github.com/greggman/twgl.js/blob/master/dist/twgl-full.js for another example:
//                 const attribInfo = gl.getActiveAttrib(program, i);
//                 // Pointers to all shader attribute variables:
//                 this.shader_attributes[attribInfo.name] = {
//                     index: gl.getAttribLocation(program, attribInfo.name),
//                     size: typeToSizeMapping[attribInfo.type],
//                     enabled: true, type: gl.FLOAT,
//                     normalized: false, stride: 0, pointer: 0
//                 };
//             }
//         }
//     }
//
//
// const Container = tiny.Container =
//     class Container {
//         // **Container** allows a way to create patch JavaScript objects within a single line.  Some properties get
//         // replaced with substitutes that you provide, without having to write out a new object from scratch.
//         // To override, simply pass in "replacement", a JS Object of keys/values you want to override, to generate
//         // a new object.  For shorthand you can leave off the key and only provide a value (pass in directly as
//         // "replacement") and a guess will be used for which member you want overridden based on type.
//         override(replacement)
//         // override(): Generate a copy by value, replacing certain properties.
//         {
//             return this.helper(replacement, Object.create(this.constructor.prototype))
//         }
//
//         replace(replacement) {
//             // replace(): Like override, but modifies the original object.
//             return this.helper(replacement, this)
//         }
//
//         helper(replacement, target) {
//             // (Internal helper function)
//             Object.assign(target, this);
//             // If a JS object was given, use its entries to override:
//             if (replacement.constructor === Object)
//                 return Object.assign(target, replacement);
//             // Otherwise we'll try to guess the key to override by type:
//             const matchingKeysByType = Object.entries(this).filter(([key, value]) => replacement instanceof value.constructor);
//             if (!matchingKeysByType[0]) throw "Container: Can't figure out which value you're trying to replace; nothing matched by type.";
//             return Object.assign(target, {[matchingKeysByType[0][0]]: replacement});
//         }
//     }


// const Material = tiny.Material =
//     class Material extends Container {
//         // **Material** contains messages for a shader program.  These configure the shader
//         // for the particular color and style of one shape being drawn.  A material consists
//         // of a pointer to the particular Shader it uses (to select that Shader for the draw
//         // command), as well as a collection of any options wanted by the shader.
//         constructor(shader, options) {
//             super();
//             Object.assign(this, {shader}, options);
//         }
//     }


// const Shader = tiny.Shader =
    // class Shader extends GraphicsCardObject {
    //     // **Shader** loads a GLSL shader program onto your graphics card, starting from a JavaScript string.
    //     // To use it, make subclasses of Shader that define these strings of GLSL code.  The base class will
    //     // command the GPU to recieve, compile, and run these programs.  In WebGL 1, the shader runs once per
    //     // every shape that is drawn onscreen.
    //
    //     // Extend the class and fill in the abstract functions, some of which define GLSL strings, and others
    //     // (updateGPU) which define the extra custom JavaScript code needed to populate your particular shader
    //     // program with all the data values it is expecting, such as matrices.  The shader pulls these values
    //     // from two places in your JavaScript:  A Material object, for values pertaining to the current shape
    //     // only, and a ProgramState object, for values pertaining to your entire Scene or program.
    //     copyOntoGraphicsCard(context) {
    //         // copyOntoGraphicsCard():  Called automatically as needed to load the
    //         // shader program onto one of your GPU contexts for its first time.
    //
    //         // Define what this object should store in each new WebGL Context:
    //         const initialGpuRepresentation = {
    //             program: undefined, gpuAddresses: undefined,
    //             vertShdr: undefined, fragShdr: undefined
    //         };
    //         // Our object might need to register to multiple GPU contexts in the case of
    //         // multiple drawing areas.  If this is a new GPU context for this object,
    //         // copy the object to the GPU.  Otherwise, this object already has been
    //         // copied over, so get a pointer to the existing instance.
    //         const gpuInstance = super.copyOntoGraphicsCard(context, initialGpuRepresentation);
    //
    //         const gl = context;
    //         const program = gpuInstance.program || context.createProgram();
    //         const vertShdr = gpuInstance.vertShdr || gl.createShader(gl.VERTEX_SHADER);
    //         const fragShdr = gpuInstance.fragShdr || gl.createShader(gl.FRAGMENT_SHADER);
    //
    //         if (gpuInstance.vertShdr) gl.detachShader(program, vertShdr);
    //         if (gpuInstance.fragShdr) gl.detachShader(program, fragShdr);
    //
    //         gl.shaderSource(vertShdr, this.vertexGlslCode());
    //         gl.compileShader(vertShdr);
    //         if (!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS))
    //             throw "Vertex shader compile error: " + gl.getShaderInfoLog(vertShdr);
    //
    //         gl.shaderSource(fragShdr, this.fragmentGlslCode());
    //         gl.compileShader(fragShdr);
    //         if (!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS))
    //             throw "Fragment shader compile error: " + gl.getShaderInfoLog(fragShdr);
    //
    //         gl.attachShader(program, vertShdr);
    //         gl.attachShader(program, fragShdr);
    //         gl.linkProgram(program);
    //         if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    //             throw "Shader linker error: " + gl.getProgramInfoLog(this.program);
    //
    //         Object.assign(gpuInstance, {
    //             program,
    //             vertShdr,
    //             fragShdr,
    //             gpuAddresses: new GraphicsAddresses(program, gl)
    //         });
    //         return gpuInstance;
    //     }
    //
    //     activate(context, bufferPointers, programState, model_transform, material) {
    //         // activate(): Selects this Shader in GPU memory so the next shape draws using it.
    //         const gpuInstance = super.activate(context);
    //
    //         context.useProgram(gpuInstance.program);
    //
    //         // --- Send over all the values needed by this particular shader to the GPU: ---
    //         this.updateGPU(context, gpuInstance.gpuAddresses, programState, model_transform, material);
    //
    //         // --- Turn on all the correct attributes and make sure they're pointing to the correct ranges in GPU memory. ---
    //         for (let [attrName, attribute] of Object.entries(gpuInstance.gpuAddresses.shader_attributes)) {
    //             if (!attribute.enabled) {
    //                 if (attribute.index >= 0) context.disableVertexAttribArray(attribute.index);
    //                 continue;
    //             }
    //             context.enableVertexAttribArray(attribute.index);
    //             context.bindBuffer(context.ARRAY_BUFFER, bufferPointers[attrName]);
    //             // Activate the correct buffer.
    //             context.vertexAttribPointer(attribute.index, attribute.size, attribute.type,
    //                 attribute.normalized, attribute.stride, attribute.pointer);
    //             // Populate each attribute
    //             // from the active buffer.
    //         }
    //     }
    //
    //     // Your custom Shader has to override the following functions:
    //     vertexGlslCode() {
    //     }
    //
    //     fragmentGlslCode() {
    //     }
    //
    //     updateGPU() {
    //     }
    //
    //     // *** How those four functions work (and how GPU shader programs work in general):
    //
    //     // vertexGlslCode() and fragmentGlslCode() should each return strings that contain
    //     // code for a custom vertex shader and fragment shader, respectively.
    //
    //     // The "Vertex Shader" is code that is sent to the graphics card at runtime, where on each
    //     // run it gets compiled and linked there.  Thereafter, all of your calls to draw shapes will
    //     // launch the vertex shader program, which runs every line of its code upon every vertex
    //     // stored in your buffer simultaneously (each instruction executes on every array index at
    //     // once).  Any GLSL "attribute" variables will appear to refer to some data field of just
    //     // one vertex, but really they affect all the stored vertices at once in parallel.
    //
    //     // The purpose of this vertex shader program is to calculate the final resting place of
    //     // vertices in screen coordinates.  Each vertex starts out in local object coordinates
    //     // and then undergoes a matrix transform to land somewhere onscreen, or else misses the
    //     // drawing area and is clipped (cancelled).  One this has program has executed on your whole
    //     // set of vertices, groups of them (three if using triangles) are connected together into
    //     // primitives, and the set of pixels your primitive overlaps onscreen is determined.  This
    //     // launches an instance of the "Fragment Shader", starting the next phase of GPU drawing.
    //
    //     // The "Fragment Shader" is more code that gets sent to the graphics card at runtime.  The
    //     // fragment shader runs after the vertex shader on a set of pixels (again, executing in
    //     // parallel on all pixels at once that were overlapped by a primitive).  This of course can
    //     // only happen once the final onscreen position of a primitive is known, which the vertex
    //     // shader found.
    //
    //     // The fragment shader fills in (shades) every pixel (fragment) overlapping where the triangle
    //     // landed.  It retrieves different values (such as vectors) that are stored at three extreme
    //     // points of the triangle, and then interpolates the values weighted by the pixel's proximity
    //     // to each extreme point, using them in formulas to determine color.  GLSL variables of type
    //     // "varying" appear to have come from a single vertex, but are actually coming from all three,
    //     // and are computed for every pixel in parallel by interpolated between the different values of
    //     // the variable stored at the three vertices in this fashion.
    //
    //     // The fragment colors may or may not become final pixel colors; there could already be other
    //     // triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the
    //     // new triangle is closer to the camera, and even if so, blending settings may interpolate some
    //     // of the old color into the result.  Finally, an image is displayed onscreen.
    //
    //     // You must define an updateGPU() function that includes the extra custom JavaScript code
    //     // needed to populate your particular shader program with all the data values it is expecting.
    // }


// const Texture = tiny.Texture =
//     class Texture extends GraphicsCardObject {
//         // **Texture** wraps a pointer to a new texture image where
//         // it is stored in GPU memory, along with a new HTML image object.
//         // This class initially copies the image to the GPU buffers,
//         // optionally generating mip maps of it and storing them there too.
//         constructor(filename, min_filter = "LINEAR_MIPMAP_LINEAR") {
//             super();
//             Object.assign(this, {filename, min_filter});
//             // Create a new HTML Image object:
//             this.image = new Image();
//             this.image.onload = () => this.ready = true;
//             this.image.crossOrigin = "Anonymous";           // Avoid a browser warning.
//             this.image.src = filename;
//         }
//
//         copyOntoGraphicsCard(context, need_initial_settings = true) {
//             // copyOntoGraphicsCard():  Called automatically as needed to load the
//             // texture image onto one of your GPU contexts for its first time.
//
//             // Define what this object should store in each new WebGL Context:
//             const initialGpuRepresentation = {texture_buffer_pointer: undefined};
//             // Our object might need to register to multiple GPU contexts in the case of
//             // multiple drawing areas.  If this is a new GPU context for this object,
//             // copy the object to the GPU.  Otherwise, this object already has been
//             // copied over, so get a pointer to the existing instance.
//             const gpuInstance = super.copyOntoGraphicsCard(context, initialGpuRepresentation);
//
//             if (!gpuInstance.texture_buffer_pointer) gpuInstance.texture_buffer_pointer = context.createTexture();
//
//             const gl = context;
//             gl.bindTexture(gl.TEXTURE_2D, gpuInstance.texture_buffer_pointer);
//
//             if (need_initial_settings) {
//                 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
//                 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//                 // Always use bi-linear sampling when zoomed out.
//                 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.min_filter]);
//                 // Let the user to set the sampling method
//                 // when zoomed in.
//             }
//
//             gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
//             if (this.min_filter == "LINEAR_MIPMAP_LINEAR")
//                 gl.generateMipmap(gl.TEXTURE_2D);
//             // If the user picked tri-linear sampling (the default) then generate
//             // the necessary "mips" of the texture and store them on the GPU with it.
//             return gpuInstance;
//         }
//
//         activate(context, texture_unit = 0) {
//             // activate(): Selects this Texture in GPU memory so the next shape draws using it.
//             // Optionally select a texture unit in case you're using a shader with many samplers.
//             // Terminate draw requests until the image file is actually loaded over the network:
//             if (!this.ready)
//                 return;
//             const gpuInstance = super.activate(context);
//             context.activeTexture(context["TEXTURE" + texture_unit]);
//             context.bindTexture(context.TEXTURE_2D, gpuInstance.texture_buffer_pointer);
//         }
//     }


// const ProgramState = tiny.ProgramState =
//     class ProgramState extends Container {
//         // **ProgramState** stores any values that affect how your whole scene is drawn,
//         // such as its current lights and the camera position.  Class Shader uses whatever
//         // values are wrapped here as inputs to your custom shader program.  Your Shader
//         // subclass must override its method "updateGPU()" to define how to send your
//         // ProgramState's particular values over to your custom shader program.
//         constructor(cameraTransform = Mat4.identity(), projectionTransform = Mat4.identity()) {
//             super();
//             this.setCamera(cameraTransform);
//             const defaults = {projectionTransform, animate: true, animationTime: 0, animationDeltaTime: 0};
//             Object.assign(this, defaults);
//         }
//
//         setCamera(matrix) {
//             // setCamera():  Applies a new (inverted) camera matrix to the ProgramState.
//             // It's often useful to cache both the camera matrix and its inverse.  Both are needed
//             // often and matrix inversion is too slow to recompute needlessly.
//             // Note that setting a camera matrix traditionally means storing the inverted version,
//             // so that's the one this function expects to receive; it automatically sets the other.
//             Object.assign(this, {cameraTransform: Mat4.inverse(matrix), camera_inverse: matrix})
//         }
//     }


// const WebglManager = tiny.WebglManager =
    // class WebglManager {
    //     // **WebglManager** manages a whole graphics program for one on-page canvas, including its
    //     // textures, shapes, shaders, and scenes.  It requests a WebGL context and stores Scenes.
    //     constructor(canvas, backgroundColor, dimensions) {
    //         const members = {
    //             instances: new Map(),
    //             scenes: [],
    //             prev_time: 0,
    //             canvas,
    //             scratchpad: {},
    //             programState: new ProgramState()
    //         };
    //         Object.assign(this, members);
    //         // Get the GPU ready, creating a new WebGL context for this canvas:
    //         for (let name of ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"]) {
    //             this.context = this.canvas.getContext(name);
    //             if (this.context) break;
    //         }
    //         if (!this.context) throw "Canvas failed to make a WebGL context.";
    //         const gl = this.context;
    //
    //         this.setSize(dimensions);
    //
    //         gl.clearColor.apply(gl, backgroundColor);           // Tell the GPU which color to clear the canvas with each frame.
    //         gl.getExtension("OES_element_index_uint");           // Load an extension to allow shapes with more than 65535 vertices.
    //         gl.enable(gl.DEPTH_TEST);                            // Enable Z-Buffering test.
    //         // Specify an interpolation method for blending "transparent" triangles over the existing pixels:
    //         gl.enable(gl.BLEND);
    //         gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //         // Store a single red pixel, as a placeholder image to prevent a console warning:
    //         gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    //         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
    //
    //         // Find the correct browser's version of requestAnimationFrame() needed for queue-ing up re-display events:
    //         window.requestAnimFrame = (w =>
    //             w.requestAnimationFrame || w.webkitRequestAnimationFrame
    //             || w.mozRequestAnimationFrame || w.oRequestAnimationFrame || w.msRequestAnimationFrame
    //             || function (callback, element) {
    //                 w.setTimeout(callback, 1000 / 60);
    //             })(window);
    //     }
    //
    //     setSize(dimensions = [1080, 600]) {
    //         // setSize():  Allows you to re-size the canvas anytime.  To work, it must change the
    //         // size in CSS, wait for style to re-flow, and then change the size again within canvas
    //         // attributes.  Both are needed because the attributes on a canvas ave a special effect
    //         // on buffers, separate from their style.
    //         const [width, height] = dimensions;
    //         this.canvas.style["width"] = width + "px";
    //         this.canvas.style["height"] = height + "px";
    //         Object.assign(this, {width, height});
    //         Object.assign(this.canvas, {width, height});
    //         // Build the canvas's matrix for converting -1 to 1 ranged coords (NCDS) into its own pixel coords:
    //         this.context.viewport(0, 0, width, height);
    //     }
    //
    //     render(time = 0) {
    //         // render(): Draw a single frame of animation, using all loaded Scene objects.  Measure
    //         // how much real time has transpired in order to animate shapes' movements accordingly.
    //         this.programState.animationDeltaTime = time - this.prev_time;
    //         if (this.programState.animate) this.programState.animationTime += this.programState.animationDeltaTime;
    //         this.prev_time = time;
    //
    //         const gl = this.context;
    //         gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //         // Clear the canvas's pixels and z-buffer.
    //
    //         const openList = [...this.scenes];
    //         while (openList.length) {
    //             // Traverse all Scenes and their children, recursively.
    //             openList.push(...openList[0].children);
    //             // Call display() to draw each registered animation:
    //             openList.shift().display(this, this.programState);
    //         }
    //         // Now that this frame is drawn, request that render() happen
    //         // again as soon as all other web page events are processed:
    //         this.event = window.requestAnimFrame(this.render.bind(this));
    //     }
    // }


// const Scene = tiny.Scene =
    // class Scene {
    //     // **Scene** is the base class for any scene part or code snippet that you can add to a
    //     // canvas.  Make your own subclass(es) of this and override their methods "display()"
    //     // and "makeControlPanel()" to make them draw to a canvas, or generate custom control
    //     // buttons and readouts, respectively.  Scenes exist in a hierarchy; their child Scenes
    //     // can either contribute more drawn shapes or provide some additional tool to the end
    //     // user via drawing additional control panel buttons or live text readouts.
    //     constructor() {
    //         this.children = [];
    //         // Set up how we'll handle key presses for the scene's control panel:
    //         const callbackBehavior = (callback, event) => {
    //             callback(event);
    //             event.preventDefault();    // Fire the callback and cancel any default browser shortcut that is an exact match.
    //             event.stopPropagation();   // Don't bubble the event to parent nodes; let child elements be targetted in isolation.
    //         }
    //         this.keyControls = new KeyboardManager(document, callbackBehavior);
    //     }
    //
    //     newLine(parent = this.controlPanel) {
    //         // newLine():  Formats a scene's control panel with a new line break.
    //         parent.appendChild(document.createElement("br"))
    //     }
    //
    //     liveString(callback, parent = this.controlPanel) {
    //         // liveString(): Create an element somewhere in the control panel that
    //         // does reporting of the scene's values in real time.  The event loop
    //         // will constantly update all HTML elements made this way.
    //         parent.appendChild(Object.assign(document.createElement("div"), {
    //             className: "liveString",
    //             onload: callback
    //         }));
    //     }
    //
    //     keyTriggeredButton(description, shortcutCombination, callback, color = '#6E6460',
    //                          releaseEvent, recipient = this, parent = this.controlPanel) {
    //         // keyTriggeredButton():  Trigger any scene behavior by assigning
    //         // a key shortcut and a labelled HTML button to fire any callback
    //         // function/method of a Scene.  Optional release callback as well.
    //         const button = parent.appendChild(document.createElement("button"));
    //         button.defaultColor = button.style.backgroundColor = color;
    //         const press = () => {
    //                 Object.assign(button.style, {
    //                     'background-color': color,
    //                     'z-index': "1", 'transform': "scale(1.5)"
    //                 });
    //                 callback.call(recipient);
    //             },
    //             release = () => {
    //                 Object.assign(button.style, {
    //                     'background-color': button.defaultColor,
    //                     'z-index': "0", 'transform': "scale(1)"
    //                 });
    //                 if (!releaseEvent) return;
    //                 releaseEvent.call(recipient);
    //             };
    //         const keyName = shortcutCombination.join('+').split(" ").join("Space");
    //         button.textContent = "(" + keyName + ") " + description;
    //         button.addEventListener("mousedown", press);
    //         button.addEventListener("mouseup", release);
    //         button.addEventListener("touchstart", press, {passive: true});
    //         button.addEventListener("touchend", release, {passive: true});
    //         if (!shortcutCombination) return;
    //         this.keyControls.add(shortcutCombination, press, release);
    //     }
    //
    //     // To use class Scene, override at least one of the below functions,
    //     // which will be automatically called by other classes:
    //     display(context, programState) {
    //     }                            // display(): Called by WebglManager for drawing.
    //     makeControlPanel() {
    //     }                            // makeControlPanel(): Called by ControlsWidget for generating interactive UI.
    //     showExplanation(documentSection) {
    //     }                            // showExplanation(): Called by TextWidget for generating documentation.
    // }
