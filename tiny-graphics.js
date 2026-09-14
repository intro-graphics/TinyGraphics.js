/**
 * @file tiny-graphics.js — the core of TinyGraphics.js v2.
 *
 * A small, readable library for learning WebGL 2.  It wraps the repetitive parts of GPU
 * communication (buffers, shader compilation, uniform lookup, render loop) and adds the
 * vector and matrix math that JavaScript lacks, while keeping every graphics idea visible:
 * you still write your own shaders, build your own matrices, and place every shape.
 *
 * Organization of this file: math first (Vector*, Matrix, Mat4), then GPU objects
 * (Vertex_Buffer, Shape, Shader, Texture, Render_Target), then the program (Program_State,
 * Webgl_Manager, Scene).  tiny-graphics-widgets.js adds web page panels, and common.js adds
 * ready-made shapes, shaders and camera controls.
 *
 * Originally written by Garett Ridge for UCLA CS 174A (2016–2020).  v2 (WebGL 2, fixes, docs)
 * by Yunqi Guo.  See docs/migrating-from-v1.md for what changed.
 *
 * ── Matrix convention ────────────────────────────────────────────────────────────────────
 * A Matrix is an Array of ROWS, so it reads exactly like a matrix written on paper:
 *      Mat4.translation(1, 2, 3)  →  [[1,0,0,1], [0,1,0,2], [0,0,1,3], [0,0,0,1]]
 * Vectors are columns and are multiplied on the right:  M.times(vec4(x, y, z, 1)).
 * A product A.times(B) applies B first.  GLSL expects column-major arrays, so matrices are
 * transposed on their way to the GPU:  Matrix.column_major(M).
 */

export const tiny = {};

// ─────────────────────────────────────────────────────────────────────────────────────────
// Vectors
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * **Vector** — a vector of any length, stored as a Float32Array.
 * Operations that return a Vector never modify the original ("plus", "times", ...);
 * operations ending in "_by" and "normalize()" modify it in place.
 * Assign with .copy() when you want a separate vector, not a second name for the same one.
 */
const Vector = tiny.Vector =
    class Vector extends Float32Array {
        static create(...arr) {
            return new Vector(arr);
        }

        // cast(): convert a list of array literals into a list of Vectors, for compact declarations.
        static cast(...args) {
            return args.map(x => Vector.from(x));
        }

        copy() {
            return new Vector(this);
        }

        equals(b) {
            return this.length === b.length && this.every((x, i) => x === b[i]);
        }

        plus(b) {
            return this.map((x, i) => x + b[i]);
        }

        minus(b) {
            return this.map((x, i) => x - b[i]);
        }

        times_pairwise(b) {
            return this.map((x, i) => x * b[i]);
        }

        scale_by(s) {
            this.forEach((x, i, a) => a[i] *= s);
        }

        times(s) {
            return this.map(x => s * x);
        }

        randomized(s) {
            return this.map(x => x + s * (Math.random() - .5));
        }

        mix(b, s) {
            return this.map((x, i) => (1 - s) * x + s * b[i]);
        }

        norm() {
            return Math.sqrt(this.dot(this));
        }

        normalized() {
            return this.times(1 / this.norm());
        }

        normalize() {
            this.scale_by(1 / this.norm());
        }

        dot(b) {
            let sum = 0;
            for (let i = 0; i < this.length; i++) sum += this[i] * b[i];
            return sum;
        }

        to3() {
            return vec3(this[0], this[1], this[2]);
        }

        to4(is_a_point) {
            return vec4(this[0], this[1], this[2], +is_a_point);
        }

        cross(b) {
            return vec3(this[1] * b[2] - this[2] * b[1],
                this[2] * b[0] - this[0] * b[2],
                this[0] * b[1] - this[1] * b[0]);
        }

        to_string() {
            return "[vector " + this.join(", ") + "]";
        }
    };

/**
 * **Vector3** — a Vector specialized to 3 entries, for speed.  Use for positions,
 * directions and normals.  Build with vec3(x, y, z).
 */
const Vector3 = tiny.Vector3 =
    class Vector3 extends Float32Array {
        static create(x, y, z) {
            const v = new Vector3(3);
            v[0] = x;
            v[1] = y;
            v[2] = z;
            return v;
        }

        static cast(...args) {
            return args.map(x => Vector3.from(x));
        }

        copy() {
            return Vector3.from(this);
        }

        equals(b) {
            return this[0] === b[0] && this[1] === b[1] && this[2] === b[2];
        }

        plus(b) {
            return vec3(this[0] + b[0], this[1] + b[1], this[2] + b[2]);
        }

        minus(b) {
            return vec3(this[0] - b[0], this[1] - b[1], this[2] - b[2]);
        }

        times(s) {
            return vec3(this[0] * s, this[1] * s, this[2] * s);
        }

        times_pairwise(b) {
            return vec3(this[0] * b[0], this[1] * b[1], this[2] * b[2]);
        }

        // In-place versions avoid allocating a new vector:
        add_by(b) {
            this[0] += b[0];
            this[1] += b[1];
            this[2] += b[2];
        }

        subtract_by(b) {
            this[0] -= b[0];
            this[1] -= b[1];
            this[2] -= b[2];
        }

        scale_by(s) {
            this[0] *= s;
            this[1] *= s;
            this[2] *= s;
        }

        scale_pairwise_by(b) {
            this[0] *= b[0];
            this[1] *= b[1];
            this[2] *= b[2];
        }

        randomized(s) {
            return vec3(this[0] + s * (Math.random() - .5),
                this[1] + s * (Math.random() - .5),
                this[2] + s * (Math.random() - .5));
        }

        mix(b, s) {
            return vec3((1 - s) * this[0] + s * b[0],
                (1 - s) * this[1] + s * b[1],
                (1 - s) * this[2] + s * b[2]);
        }

        norm() {
            return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
        }

        normalized() {
            const d = 1 / this.norm();
            return vec3(this[0] * d, this[1] * d, this[2] * d);
        }

        normalize() {
            this.scale_by(1 / this.norm());
        }

        dot(b) {
            return this[0] * b[0] + this[1] * b[1] + this[2] * b[2];
        }

        cross(b) {
            return vec3(this[1] * b[2] - this[2] * b[1],
                this[2] * b[0] - this[0] * b[2],
                this[0] * b[1] - this[1] * b[0]);
        }

        // to4(): homogeneous coordinates — w = 1 for a point, w = 0 for a direction.
        to4(is_a_point) {
            return vec4(this[0], this[1], this[2], +is_a_point);
        }

        to3() {
            return this.copy();
        }

        to_string() {
            return "[vec3 " + this.join(", ") + "]";
        }
    };

/**
 * **Vector4** — a Vector specialized to 4 entries: homogeneous points (w = 1),
 * directions (w = 0), and RGBA colors.  Build with vec4(x, y, z, w).
 * norm() and normalize() act on x, y, z only, since w is not part of the length.
 */
const Vector4 = tiny.Vector4 =
    class Vector4 extends Float32Array {
        static create(x, y, z, w) {
            const v = new Vector4(4);
            v[0] = x;
            v[1] = y;
            v[2] = z;
            v[3] = w;
            return v;
        }

        static cast(...args) {
            return args.map(x => Vector4.from(x));
        }

        copy() {
            return Vector4.from(this);
        }

        equals(b) {
            return this[0] === b[0] && this[1] === b[1] && this[2] === b[2] && this[3] === b[3];
        }

        plus(b) {
            return vec4(this[0] + b[0], this[1] + b[1], this[2] + b[2], this[3] + b[3]);
        }

        minus(b) {
            return vec4(this[0] - b[0], this[1] - b[1], this[2] - b[2], this[3] - b[3]);
        }

        times(s) {
            return vec4(this[0] * s, this[1] * s, this[2] * s, this[3] * s);
        }

        times_pairwise(b) {
            return vec4(this[0] * b[0], this[1] * b[1], this[2] * b[2], this[3] * b[3]);
        }

        add_by(b) {
            this[0] += b[0];
            this[1] += b[1];
            this[2] += b[2];
            this[3] += b[3];
        }

        subtract_by(b) {
            this[0] -= b[0];
            this[1] -= b[1];
            this[2] -= b[2];
            this[3] -= b[3];
        }

        scale_by(s) {
            this[0] *= s;
            this[1] *= s;
            this[2] *= s;
            this[3] *= s;
        }

        scale_pairwise_by(b) {
            this[0] *= b[0];
            this[1] *= b[1];
            this[2] *= b[2];
            this[3] *= b[3];
        }

        randomized(s) {
            return vec4(this[0] + s * (Math.random() - .5),
                this[1] + s * (Math.random() - .5),
                this[2] + s * (Math.random() - .5),
                this[3] + s * (Math.random() - .5));
        }

        mix(b, s) {
            return vec4((1 - s) * this[0] + s * b[0],
                (1 - s) * this[1] + s * b[1],
                (1 - s) * this[2] + s * b[2],
                (1 - s) * this[3] + s * b[3]);
        }

        norm() {
            return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
        }

        normalized() {
            const d = 1 / this.norm();
            return vec4(this[0] * d, this[1] * d, this[2] * d, this[3]);
        }

        normalize() {
            const d = 1 / this.norm();
            this[0] *= d;
            this[1] *= d;
            this[2] *= d;
        }

        dot(b) {
            return this[0] * b[0] + this[1] * b[1] + this[2] * b[2] + this[3] * b[3];
        }

        to3() {
            return vec3(this[0], this[1], this[2]);
        }

        to_string() {
            return "[vec4 " + this.join(", ") + "]";
        }
    };

const vec = tiny.vec = Vector.create;
const vec3 = tiny.vec3 = Vector3.create;
const vec4 = tiny.vec4 = Vector4.create;

/**
 * **Color** — an RGBA Vector4 with each channel in [0, 1].
 * color(r, g, b, a) from floats, hex_color("#1a9ffa", alpha) from a CSS hex string.
 */
const Color = tiny.Color =
    class Color extends Vector4 {
        static create_from_float(r, g, b, a = 1) {
            return Vector4.create(r, g, b, a);
        }

        static create_from_hex(hex, alpha = 1) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (!result) throw new Error(`hex_color: "${hex}" is not a 6-digit hex color like "#1a9ffa".`);
            return Vector4.create(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255,
                parseInt(result[3], 16) / 255, alpha);
        }
    };

const color = tiny.color = Color.create_from_float;
const hex_color = tiny.hex_color = Color.create_from_hex;

// ─────────────────────────────────────────────────────────────────────────────────────────
// Matrices
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * **Matrix** — an M×N matrix stored as an Array of rows.
 *   M.times(b)          b may be a scalar, a Vector4 (returns a Vector4), or another Matrix.
 *   M.pre_multiply(b)   overwrite M with b·M.      M.post_multiply(b)   overwrite M with M·b.
 *   M.transposed(), M.copy(), M.equals(b), M.plus(b), M.minus(b), M.set_identity(m, n)
 *   Matrix.flatten_2D_to_1D(M)   row-major Float32Array of M's entries.
 *   Matrix.column_major(M)       Float32Array ready for gl.uniformMatrix*fv (i.e. M transposed).
 */
const Matrix = tiny.Matrix =
    class Matrix extends Array {
        constructor(...args) {
            super(0);
            this.push(...args);
        }

        static flatten_2D_to_1D(M) {
            let index = 0;
            const floats = new Float32Array(M.length && M.length * M[0].length);
            for (let i = 0; i < M.length; i++)
                for (let j = 0; j < M[i].length; j++) floats[index++] = M[i][j];
            return floats;
        }

        // column_major(): GLSL stores matrices column by column; ours are row by row.
        static column_major(M) {
            const rows = M.length, cols = M[0].length, floats = new Float32Array(rows * cols);
            for (let c = 0, k = 0; c < cols; c++)
                for (let r = 0; r < rows; r++) floats[k++] = M[r][c];
            return floats;
        }

        set(M) {
            this.length = 0;
            this.push(...M);
        }

        set_identity(m, n) {
            this.length = 0;
            for (let i = 0; i < m; i++) {
                this.push(Array(n).fill(0));
                if (i < n) this[i][i] = 1;
            }
        }

        sub_block(start, end) {
            return Matrix.from(this.slice(start[0], end[0]).map(r => r.slice(start[1], end[1])));
        }

        copy() {
            return this.map(r => [...r]);
        }

        equals(b) {
            return this.every((r, i) => r.every((x, j) => x === b[i][j]));
        }

        plus(b) {
            return this.map((r, i) => r.map((x, j) => x + b[i][j]));
        }

        minus(b) {
            return this.map((r, i) => r.map((x, j) => x - b[i][j]));
        }

        transposed() {
            return this[0].map((_, j) => this.map(r => r[j]));
        }

        times(b, optional_preallocated_result) {
            const len = b.length;
            if (typeof len === "undefined")                              // Matrix * scalar
                return this.map(r => r.map(x => b * x));
            const len2 = b[0].length;
            if (typeof len2 === "undefined") {                           // Matrix * Vector
                const result = optional_preallocated_result || new Vector4(this.length);
                for (let r = 0; r < this.length; r++) {
                    let sum = 0;
                    for (let c = 0; c < len; c++) sum += this[r][c] * b[c];
                    result[r] = sum;
                }
                return result;
            }
            const result = optional_preallocated_result || Matrix.from(new Array(this.length));  // Matrix * Matrix
            for (let r = 0; r < this.length; r++) {
                if (!optional_preallocated_result) result[r] = new Array(len2);
                for (let c = 0; c < len2; c++) {
                    let sum = 0;
                    for (let k = 0; k < len; k++) sum += this[r][k] * b[k][c];
                    result[r][c] = sum;
                }
            }
            return result;
        }

        pre_multiply(b) {
            const new_value = b.times(this);
            this.length = 0;
            this.push(...new_value);
            return this;
        }

        post_multiply(b) {
            const new_value = this.times(b);
            this.length = 0;
            this.push(...new_value);
            return this;
        }

        to_string() {
            return "[" + this.map(r => "[" + r.join(", ") + "]").join(" ") + "]";
        }
    };

// Accept either three numbers or one array-like of three numbers.
const xyz = (x, y, z) => (typeof x === "object" && x !== null) ? [x[0], x[1], x[2]] : [x, y, z];

/**
 * **Mat4** — generators for the 4×4 matrices graphics needs.  Every method returns a new Matrix.
 */
const Mat4 = tiny.Mat4 =
    class Mat4 extends Matrix {
        static identity() {
            return Matrix.of([1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]);
        }

        // rotation(angle, x, y, z) or rotation(angle, axis): right-handed rotation about any axis
        // through the origin (Rodrigues' formula).  The axis need not be unit length.
        static rotation(angle, x, y, z) {
            let [i, j, k] = xyz(x, y, z);
            const n = Math.sqrt(i * i + j * j + k * k);
            if (!(n > 0)) throw new Error("Mat4.rotation(): the rotation axis must not be the zero vector.");
            [i, j, k] = [i / n, j / n, k / n];
            const c = Math.cos(angle), s = Math.sin(angle), omc = 1 - c;
            return Matrix.of([i * i * omc + c, i * j * omc - k * s, i * k * omc + j * s, 0],
                [i * j * omc + k * s, j * j * omc + c, j * k * omc - i * s, 0],
                [i * k * omc - j * s, j * k * omc + i * s, k * k * omc + c, 0],
                [0, 0, 0, 1]);
        }

        // scale(x, y, z) or scale(vector)
        static scale(x, y, z) {
            [x, y, z] = xyz(x, y, z);
            return Matrix.of([x, 0, 0, 0], [0, y, 0, 0], [0, 0, z, 0], [0, 0, 0, 1]);
        }

        // translation(x, y, z) or translation(vector)
        static translation(x, y, z) {
            [x, y, z] = xyz(x, y, z);
            return Matrix.of([1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]);
        }

        /**
         * look_at(eye, at, up): the VIEW matrix (world → camera) for a camera at `eye` looking
         * toward `at`.  Its rows are the camera's basis vectors u (right), v (up), n (backward):
         *     n = normalize(eye − at),  u = normalize(up × n),  v = n × u
         *     V = [[u, −u·eye], [v, −v·eye], [n, −n·eye], [0, 0, 0, 1]]
         * Pass it to program_state.set_camera().  To aim a non-camera object at something, use
         * Mat4.inverse(look_at(...)) instead, which is the camera's own model matrix.
         */
        static look_at(eye, at, up) {
            eye = vec3(...xyz(eye));
            at = vec3(...xyz(at));
            up = vec3(...xyz(up));
            const n = eye.minus(at).normalized();
            const u = up.cross(n).normalized();
            if (!u.every(x => Number.isFinite(x)))
                throw new Error("Mat4.look_at(): eye equals at, or the view direction is parallel to up.");
            const v = n.cross(u);
            return Matrix.of([u[0], u[1], u[2], -u.dot(eye)],
                [v[0], v[1], v[2], -v.dot(eye)],
                [n[0], n[1], n[2], -n.dot(eye)],
                [0, 0, 0, 1]);
        }

        /**
         * orthographic(left, right, bottom, top, near, far): a box-shaped view volume.
         * near and far are positive DISTANCES in front of the camera (camera space z = −near, −far).
         * Maps x ∈ [l, r] → [−1, 1], y ∈ [b, t] → [−1, 1], z = −near → −1, z = −far → +1.
         */
        static orthographic(left, right, bottom, top, near, far) {
            const [l, r, b, t, n, f] = [left, right, bottom, top, near, far];
            return Matrix.of([2 / (r - l), 0, 0, -(r + l) / (r - l)],
                [0, 2 / (t - b), 0, -(t + b) / (t - b)],
                [0, 0, -2 / (f - n), -(f + n) / (f - n)],
                [0, 0, 0, 1]);
        }

        /**
         * frustum(left, right, bottom, top, near, far): a general (possibly off-center) perspective
         * view volume.  left..top are measured ON THE NEAR PLANE; near and far are positive distances.
         * After the divide by w, z = −near → −1 and z = −far → +1.
         */
        static frustum(left, right, bottom, top, near, far) {
            const [l, r, b, t, n, f] = [left, right, bottom, top, near, far];
            return Matrix.of([2 * n / (r - l), 0, (r + l) / (r - l), 0],
                [0, 2 * n / (t - b), (t + b) / (t - b), 0],
                [0, 0, -(f + n) / (f - n), -2 * f * n / (f - n)],
                [0, 0, -1, 0]);
        }

        // perspective(fov_y, aspect, near, far): a symmetric frustum.  fov_y is the full vertical
        // field of view in radians; aspect is width / height.
        static perspective(fov_y, aspect, near, far) {
            const f = 1 / Math.tan(fov_y / 2), d = far - near;
            return Matrix.of([f / aspect, 0, 0, 0],
                [0, f, 0, 0],
                [0, 0, -(near + far) / d, -2 * near * far / d],
                [0, 0, -1, 0]);
        }

        // inverse(m): general 4×4 inverse by cofactors.  Relatively slow; cache results you reuse.
        static inverse(m) {
            const result = Mat4.identity(), m00 = m[0][0], m01 = m[0][1], m02 = m[0][2], m03 = m[0][3],
                m10 = m[1][0], m11 = m[1][1], m12 = m[1][2], m13 = m[1][3],
                m20 = m[2][0], m21 = m[2][1], m22 = m[2][2], m23 = m[2][3],
                m30 = m[3][0], m31 = m[3][1], m32 = m[3][2], m33 = m[3][3];
            result[0][0] = m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33;
            result[0][1] = m03 * m22 * m31 - m02 * m23 * m31 - m03 * m21 * m32 + m01 * m23 * m32 + m02 * m21 * m33 - m01 * m22 * m33;
            result[0][2] = m02 * m13 * m31 - m03 * m12 * m31 + m03 * m11 * m32 - m01 * m13 * m32 - m02 * m11 * m33 + m01 * m12 * m33;
            result[0][3] = m03 * m12 * m21 - m02 * m13 * m21 - m03 * m11 * m22 + m01 * m13 * m22 + m02 * m11 * m23 - m01 * m12 * m23;
            result[1][0] = m13 * m22 * m30 - m12 * m23 * m30 - m13 * m20 * m32 + m10 * m23 * m32 + m12 * m20 * m33 - m10 * m22 * m33;
            result[1][1] = m02 * m23 * m30 - m03 * m22 * m30 + m03 * m20 * m32 - m00 * m23 * m32 - m02 * m20 * m33 + m00 * m22 * m33;
            result[1][2] = m03 * m12 * m30 - m02 * m13 * m30 - m03 * m10 * m32 + m00 * m13 * m32 + m02 * m10 * m33 - m00 * m12 * m33;
            result[1][3] = m02 * m13 * m20 - m03 * m12 * m20 + m03 * m10 * m22 - m00 * m13 * m22 - m02 * m10 * m23 + m00 * m12 * m23;
            result[2][0] = m11 * m23 * m30 - m13 * m21 * m30 + m13 * m20 * m31 - m10 * m23 * m31 - m11 * m20 * m33 + m10 * m21 * m33;
            result[2][1] = m03 * m21 * m30 - m01 * m23 * m30 - m03 * m20 * m31 + m00 * m23 * m31 + m01 * m20 * m33 - m00 * m21 * m33;
            result[2][2] = m01 * m13 * m30 - m03 * m11 * m30 + m03 * m10 * m31 - m00 * m13 * m31 - m01 * m10 * m33 + m00 * m11 * m33;
            result[2][3] = m03 * m11 * m20 - m01 * m13 * m20 - m03 * m10 * m21 + m00 * m13 * m21 + m01 * m10 * m23 - m00 * m11 * m23;
            result[3][0] = m12 * m21 * m30 - m11 * m22 * m30 - m12 * m20 * m31 + m10 * m22 * m31 + m11 * m20 * m32 - m10 * m21 * m32;
            result[3][1] = m01 * m22 * m30 - m02 * m21 * m30 + m02 * m20 * m31 - m00 * m22 * m31 - m01 * m20 * m32 + m00 * m21 * m32;
            result[3][2] = m02 * m11 * m30 - m01 * m12 * m30 - m02 * m10 * m31 + m00 * m12 * m31 + m01 * m10 * m32 - m00 * m11 * m32;
            result[3][3] = m01 * m12 * m20 - m02 * m11 * m20 + m02 * m10 * m21 - m00 * m12 * m21 - m01 * m10 * m22 + m00 * m11 * m22;
            const det = m00 * result[0][0] + m10 * result[0][1] + m20 * result[0][2] + m30 * result[0][3];
            if (det === 0) throw new Error("Mat4.inverse(): the matrix is singular (determinant 0), e.g. a scale by 0.");
            return result.times(1 / det);
        }

        /**
         * normal_matrix(model): the 3×3 matrix that transforms NORMAL vectors correctly —
         * the inverse transpose of model's upper-left 3×3.  For rotations it equals the rotation;
         * under non-uniform scale, transforming normals by the model matrix itself would tilt them
         * off the surface.  Returned as a Matrix of 3 rows.
         */
        static normal_matrix(model) {
            const [a, b, c] = model[0], [d, e, f] = model[1], [g, h, i] = model[2];
            const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g;
            const det = a * A + b * B + c * C;
            if (det === 0) throw new Error("Mat4.normal_matrix(): the model matrix is singular.");
            // Cofactor matrix divided by the determinant equals the inverse transpose.
            return Matrix.of([A / det, B / det, C / det],
                [(c * h - b * i) / det, (a * i - c * g) / det, (b * g - a * h) / det],
                [(b * f - c * e) / det, (c * d - a * f) / det, (a * e - b * d) / det]);
        }
    };

// ─────────────────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * **Keyboard_Manager** tracks which keys are held and fires callbacks for key combinations.
 * add(["Shift", "T"], on_down, on_up).  Key names follow KeyboardEvent.key.  Modifiers must match exactly.
 */
const Keyboard_Manager = tiny.Keyboard_Manager =
    class Keyboard_Manager {
        constructor(target = document, callback_behavior = (callback, event) => callback(event)) {
            this.saved_controls = {};
            this.actively_pressed_keys = new Set();
            this.callback_behavior = callback_behavior;
            target.addEventListener("keydown", this.key_down_handler.bind(this));
            target.addEventListener("keyup", this.key_up_handler.bind(this));
            window.addEventListener("focus", () => this.actively_pressed_keys.clear());  // avoid stuck keys
        }

        key_down_handler(event) {
            if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;  // don't hijack typing
            this.actively_pressed_keys.add(event.key);
            for (const saved of Object.values(this.saved_controls)) {
                if (saved.shortcut_combination.every(s => this.actively_pressed_keys.has(s))
                    && event.ctrlKey === saved.shortcut_combination.includes("Control")
                    && event.shiftKey === saved.shortcut_combination.includes("Shift")
                    && event.altKey === saved.shortcut_combination.includes("Alt")
                    && event.metaKey === saved.shortcut_combination.includes("Meta"))
                    this.callback_behavior(saved.callback, event);
            }
        }

        key_up_handler(event) {
            const lower_symbols = "qwertyuiopasdfghjklzxcvbnm1234567890-=[]\\;',./",
                upper_symbols = "QWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*()_+{}|:\"<>?";
            const lifted_key_symbols = [event.key, upper_symbols[lower_symbols.indexOf(event.key)],
                lower_symbols[upper_symbols.indexOf(event.key)]];
            for (const saved of Object.values(this.saved_controls))
                if (lifted_key_symbols.some(s => saved.shortcut_combination.includes(s)))
                    this.callback_behavior(saved.keyup_callback, event);
            lifted_key_symbols.forEach(k => this.actively_pressed_keys.delete(k));
        }

        add(shortcut_combination, callback = () => {}, keyup_callback = () => {}) {
            this.saved_controls[shortcut_combination.join('+')] = {shortcut_combination, callback, keyup_callback};
        }
    };

// ─────────────────────────────────────────────────────────────────────────────────────────
// GPU objects
// ─────────────────────────────────────────────────────────────────────────────────────────

// Accept either a WebGL2RenderingContext or a Webgl_Manager wherever a GL context is expected.
const as_gl = context => (context && context.gl) ? context.gl : context;

/**
 * **Graphics_Card_Object** — base class for anything that must be copied onto a GPU before use.
 * An object may live on several WebGL contexts (several canvases), so each context gets its own
 * "GPU instance": the buffers, programs or textures WebGL created for it.
 */
const Graphics_Card_Object = tiny.Graphics_Card_Object =
    class Graphics_Card_Object {
        constructor() {
            this.gpu_instances = new Map();
        }

        copy_onto_graphics_card(context, initial_gpu_representation) {
            const existing_instance = this.gpu_instances.get(context);
            if (!existing_instance) {
                // Uploading is slow.  Hundreds of new GPU objects almost always means a Shape, Shader
                // or Texture is being created with `new` inside display(), i.e. once per frame.
                Graphics_Card_Object.idiot_alarm |= 0;
                if (Graphics_Card_Object.idiot_alarm++ > 200)
                    throw new Error(`You are sending a lot of object definitions to the GPU, probably by mistake.
Do not call "new" on a Shape, Shader or Texture inside display(): that re-creates and re-uploads it every frame.
Create them once in your Scene's constructor, keep them as members, and reuse them.`);
            }
            return existing_instance || this.gpu_instances.set(context, initial_gpu_representation).get(context);
        }

        activate(context, ...args) {
            return this.gpu_instances.get(context) || this.copy_onto_graphics_card(context, ...args);
        }
    };

/**
 * **Vertex_Buffer** — per-vertex data for one shape, plus the index list that connects vertices
 * into primitives.  Subclass it and fill `this.arrays` (one array per vertex field, e.g. position,
 * normal, texture_coord) and `this.indices` in the constructor.
 *
 * A shader reads field X through a GLSL input declared as `in vec3 X;`.  The names must match.
 */
const Vertex_Buffer = tiny.Vertex_Buffer =
    class Vertex_Buffer extends Graphics_Card_Object {
        constructor(...array_names) {
            super();
            [this.arrays, this.indices] = [{}, []];
            for (const name of array_names) this.arrays[name] = [];
        }

        /**
         * copy_onto_graphics_card(gl, selection_of_arrays, write_to_indices): upload the arrays.
         * Called automatically on first draw.  Call it yourself to re-upload changed data — for
         * example copy_onto_graphics_card(gl, ["position", "normal"], false) after editing positions.
         * The array lengths must not change after the first upload.
         */
        copy_onto_graphics_card(context, selection_of_arrays = Object.keys(this.arrays), write_to_indices = true) {
            const gl = as_gl(context);
            const did_exist = this.gpu_instances.get(gl);
            const gpu_instance = super.copy_onto_graphics_card(gl, {webGL_buffer_pointers: {}, vaos: new Map()});
            const write = did_exist ? (target, data) => gl.bufferSubData(target, 0, data)
                : (target, data) => gl.bufferData(target, data, gl.STATIC_DRAW);

            // Buffers are bound to a VAO later; unbind any VAO so we don't disturb one.
            gl.bindVertexArray(null);
            for (const name of selection_of_arrays) {
                if (!this.arrays[name]) throw new Error(`copy_onto_graphics_card(): this shape has no array named "${name}".`);
                if (!did_exist || !gpu_instance.webGL_buffer_pointers[name])
                    gpu_instance.webGL_buffer_pointers[name] = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, gpu_instance.webGL_buffer_pointers[name]);
                write(gl.ARRAY_BUFFER, Matrix.flatten_2D_to_1D(this.arrays[name]));
            }
            if (this.indices.length && write_to_indices) {
                if (!did_exist || !gpu_instance.index_buffer) gpu_instance.index_buffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu_instance.index_buffer);
                write(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));
            }
            return gpu_instance;
        }

        // vertex_array_for(): one Vertex Array Object per (shape, shader) pair records which buffer
        // feeds which shader input, so switching shaders can never leave a stale attribute enabled.
        vertex_array_for(gl, gpu_instance, shader_instance) {
            let vao = gpu_instance.vaos.get(shader_instance.program);
            if (vao) return vao;
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            for (const [name, attribute] of Object.entries(shader_instance.gpu_addresses.shader_attributes)) {
                const buffer = gpu_instance.webGL_buffer_pointers[name];
                if (!buffer) {
                    Vertex_Buffer.warn_once(`A shader reads "in ... ${name}", but this ${this.constructor.name} has no "${name}" array; that input will read as zero.`);
                    continue;
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.enableVertexAttribArray(attribute.index);
                gl.vertexAttribPointer(attribute.index, attribute.size, gl.FLOAT, false, 0, 0);
            }
            if (gpu_instance.index_buffer) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu_instance.index_buffer);
            gpu_instance.vaos.set(shader_instance.program, vao);
            return vao;
        }

        static warn_once(message) {
            Vertex_Buffer.warned = Vertex_Buffer.warned || new Set();
            if (!Vertex_Buffer.warned.has(message)) {
                Vertex_Buffer.warned.add(message);
                console.warn(message);
            }
        }

        execute_shaders(gl, gpu_instance, type) {
            // Draw with indices if there are any; otherwise every N consecutive vertices form a primitive.
            if (this.indices.length) gl.drawElements(gl[type], this.indices.length, gl.UNSIGNED_INT, 0);
            else gl.drawArrays(gl[type], 0, Object.values(this.arrays)[0].length);
        }

        /**
         * draw(webgl_manager, program_state, model_transform, material, type = "TRIANGLES")
         * type may be any WebGL primitive name: "TRIANGLES", "LINES", "LINE_STRIP", "POINTS", ...
         */
        draw(webgl_manager, program_state, model_transform, material, type = "TRIANGLES") {
            const gl = as_gl(webgl_manager);
            if (!material || !material.shader)
                throw new Error(`${this.constructor.name}.draw(): the fourth argument must be a Material (new Material(shader, options)).`);
            const gpu_instance = this.activate(gl);
            const shader_instance = material.shader.activate(gl, program_state, model_transform, material);
            gl.bindVertexArray(this.vertex_array_for(gl, gpu_instance, shader_instance));
            this.execute_shaders(gl, gpu_instance, type);
            gl.bindVertexArray(null);
        }
    };

/**
 * **Shape** — a Vertex_Buffer whose vertices live in 3D space: it has at least `position` and
 * `normal` arrays (of vec3).  Adds tools for building compound shapes and for flat shading.
 *
 * Every array must have an entry for every vertex; an index pointing past the end of any array
 * draws nothing and logs a GPU error.
 */
const Shape = tiny.Shape =
    class Shape extends Vertex_Buffer {
        /**
         * insert_transformed_copy_into(recipient, args, points_transform): build a new instance of
         * this Shape class with `args`, transform it, and append it into `recipient`.  Compound shapes
         * draw in one call, which is much faster than many small draws.
         */
        static insert_transformed_copy_into(recipient, args, points_transform = Mat4.identity()) {
            const temp_shape = new this(...args);
            const normal_transform = Mat4.normal_matrix(points_transform);
            recipient.indices.push(...temp_shape.indices.map(i => i + recipient.arrays.position.length));
            for (const a in temp_shape.arrays) {
                if (!recipient.arrays[a]) recipient.arrays[a] = [];
                if (a === "position" || a === "tangents")
                    recipient.arrays[a].push(...temp_shape.arrays[a].map(p => points_transform.times(p.to4(1)).to3()));
                else if (a === "normal")
                    // Normals use the inverse transpose, which keeps them perpendicular under non-uniform scale.
                    recipient.arrays[a].push(...temp_shape.arrays[a].map(n => vec3(...normal_transform.times(n)).normalized()));
                else recipient.arrays[a].push(...temp_shape.arrays[a]);
            }
        }

        // make_flat_shaded_version(): a new class that builds this Shape, then un-shares its vertices
        // and replaces its normals with per-face normals.  Usage: new (Cube.prototype.make_flat_shaded_version())()
        make_flat_shaded_version() {
            return class extends this.constructor {
                constructor(...args) {
                    super(...args);
                    this.duplicate_the_shared_vertices();
                    this.flat_shade();
                }
            };
        }

        // duplicate_the_shared_vertices(): give every triangle its own three vertices, so neighbouring
        // triangles no longer fight over one normal at a shared corner.
        duplicate_the_shared_vertices() {
            const arrays = {};
            for (const arr in this.arrays) arrays[arr] = [];
            for (const index of this.indices)
                for (const arr in this.arrays) arrays[arr].push(this.arrays[arr][index]);
            Object.assign(this.arrays, arrays);
            this.indices = this.indices.map((x, i) => i);
        }

        // flat_shade(): set each triangle's three normals to its face normal.  The face normal comes
        // from the cross product of two edges; its sign is chosen to point away from the origin, which
        // is right for shapes built around their own center.
        flat_shade() {
            const count = this.indices.length ? this.indices.length : this.arrays.position.length;
            for (let counter = 0; counter + 2 < count; counter += 3) {
                const indices = this.indices.length ? [this.indices[counter], this.indices[counter + 1], this.indices[counter + 2]]
                    : [counter, counter + 1, counter + 2];
                const [p1, p2, p3] = indices.map(i => this.arrays.position[i]);
                const n1 = p1.minus(p2).cross(p3.minus(p1)).normalized();
                if (n1.times(.1).plus(p1).norm() < p1.norm()) n1.scale_by(-1);
                for (const i of indices) this.arrays.normal[i] = Vector3.from(n1);
            }
        }

        // normalize_positions(): center the shape on the origin and scale it to a unit-ish size.
        normalize_positions(keep_aspect_ratios = true) {
            let p_arr = this.arrays.position;
            const average_position = p_arr.reduce((acc, p) => acc.plus(p.times(1 / p_arr.length)), vec3(0, 0, 0));
            p_arr = p_arr.map(p => p.minus(average_position));
            const average_lengths = p_arr.reduce((acc, p) =>
                acc.plus(p.map(x => Math.abs(x)).times(1 / p_arr.length)), vec3(0, 0, 0));
            if (keep_aspect_ratios)
                this.arrays.position = p_arr.map(p => p.map((x, i) => x / average_lengths[i]));
            else
                this.arrays.position = p_arr.map(p => p.times(1 / average_lengths.norm()));
        }
    };

/**
 * **Light** — one light: a homogeneous position (w = 1 point light, w = 0 directional light),
 * a color, and a size.  Brightness falls off as 1 / (1 + attenuation · distance²), attenuation = 1/size.
 */
const Light = tiny.Light =
    class Light {
        constructor(position, color, size) {
            Object.assign(this, {position, color, attenuation: 1 / size});
        }
    };

/**
 * **Graphics_Addresses** — (internal) after a shader links, look up where each uniform lives and
 * the location and size of each vertex input.  Shader.update_GPU() receives this object, so a
 * uniform declared `uniform float ambient;` is reachable as gpu_addresses.ambient.
 */
const Graphics_Addresses = tiny.Graphics_Addresses =
    class Graphics_Addresses {
        constructor(program, gl) {
            const num_uniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < num_uniforms; ++i) {
                const u = gl.getActiveUniform(program, i).name.split('[')[0];
                this[u] = gl.getUniformLocation(program, u);
            }
            this.shader_attributes = {};
            const type_to_size_mapping = {
                [gl.FLOAT]: 1, [gl.FLOAT_VEC2]: 2, [gl.FLOAT_VEC3]: 3, [gl.FLOAT_VEC4]: 4
            };
            const num_attributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
            for (let i = 0; i < num_attributes; i++) {
                const info = gl.getActiveAttrib(program, i);
                if (!(info.type in type_to_size_mapping))
                    throw new Error(`Shader input "${info.name}" must be a float, vec2, vec3 or vec4.`);
                this.shader_attributes[info.name] = {
                    index: gl.getAttribLocation(program, info.name),
                    size: type_to_size_mapping[info.type]
                };
            }
        }
    };

/**
 * **Container** — lets you make a modified copy of an object in one expression:
 *   material.override({color: red})   new object, `color` replaced
 *   material.override(red)            same, guessing the key by the value's type
 *   material.replace({...})           modify in place
 */
const Container = tiny.Container =
    class Container {
        override(replacement) {
            return this.helper(replacement, Object.create(this.constructor.prototype));
        }

        replace(replacement) {
            return this.helper(replacement, this);
        }

        helper(replacement, target) {
            Object.assign(target, this);
            if (replacement.constructor === Object) return Object.assign(target, replacement);
            const matching_keys_by_type = Object.entries(this).filter(([key, value]) =>
                value !== undefined && value !== null && replacement instanceof value.constructor);
            if (!matching_keys_by_type[0])
                throw new Error("Container.override(): can't tell which property to replace; pass an object like {color: ...}.");
            return Object.assign(target, {[matching_keys_by_type[0][0]]: replacement});
        }
    };

/**
 * **Material** — the per-shape settings for one draw: which Shader to use, plus any options that
 * shader reads (color, ambient, texture, ...).
 */
const Material = tiny.Material =
    class Material extends Container {
        constructor(shader, options) {
            super();
            if (!(shader instanceof Shader)) throw new Error("new Material(shader, options): the first argument must be a Shader instance.");
            Object.assign(this, {shader}, options);
        }
    };

// Show GLSL source with line numbers around a compile error.
function annotate_glsl_error(kind, source, log) {
    const lines = source.split("\n");
    const bad = new Set([...log.matchAll(/ERROR:\s*\d+:(\d+)/g)].map(m => +m[1]));
    const listing = lines.map((l, i) => `${bad.has(i + 1) ? ">>" : "  "}${String(i + 1).padStart(4)}  ${l}`)
        .filter((_, i) => !bad.size || [...bad].some(b => Math.abs(b - (i + 1)) <= 3)).join("\n");
    return `${kind} shader failed to compile:\n${log.trim()}\n\n${listing}`;
}

/**
 * **Shader** — a GPU program written in GLSL ES 3.00.  Subclass it and override:
 *   vertex_glsl_code()     returns the vertex shader source   (must start with "#version 300 es")
 *   fragment_glsl_code()   returns the fragment shader source (must start with "#version 300 es")
 *   update_GPU(gl, gpu_addresses, program_state, model_transform, material)
 *                          sends this draw's uniform values: gl.uniform*(gpu_addresses.NAME, value)
 *
 * The vertex shader runs once per vertex and must write gl_Position (clip coordinates); its `out`
 * variables are interpolated across each primitive by the rasterizer.  The fragment shader then
 * runs once per covered pixel, reads those interpolated `in` variables, and writes a color.
 * Values that belong to one shape come from the Material; values shared by the whole scene
 * (camera, projection, lights, time) come from the Program_State.
 */
const Shader = tiny.Shader =
    class Shader extends Graphics_Card_Object {
        copy_onto_graphics_card(context) {
            const gl = as_gl(context);
            const gpu_instance = super.copy_onto_graphics_card(gl, {program: undefined, gpu_addresses: undefined});
            const program = gl.createProgram();
            const compile = (type, source, kind) => {
                if (typeof source !== "string" || !source.trimStart().startsWith("#version 300 es"))
                    throw new Error(`${this.constructor.name}.${kind.toLowerCase()}_glsl_code() must return a string that begins with "#version 300 es".`);
                const s = gl.createShader(type);
                gl.shaderSource(s, source);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
                    throw new Error(`${this.constructor.name}: ` + annotate_glsl_error(kind, source, gl.getShaderInfoLog(s)));
                gl.attachShader(program, s);
            };
            compile(gl.VERTEX_SHADER, this.vertex_glsl_code(), "Vertex");
            compile(gl.FRAGMENT_SHADER, this.fragment_glsl_code(), "Fragment");
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS))
                throw new Error(`${this.constructor.name}: shader program failed to link:\n` + gl.getProgramInfoLog(program));
            Object.assign(gpu_instance, {program, gpu_addresses: new Graphics_Addresses(program, gl)});
            return gpu_instance;
        }

        // activate(): select this program and send it the values for the upcoming draw.
        activate(context, program_state, model_transform, material) {
            const gl = as_gl(context);
            const gpu_instance = super.activate(gl);
            gl.useProgram(gpu_instance.program);
            this.update_GPU(gl, gpu_instance.gpu_addresses, program_state, model_transform, material);
            return gpu_instance;
        }

        vertex_glsl_code() {
            throw new Error(`${this.constructor.name} must override vertex_glsl_code().`);
        }

        fragment_glsl_code() {
            throw new Error(`${this.constructor.name} must override fragment_glsl_code().`);
        }

        update_GPU(gl, gpu_addresses, program_state, model_transform, material) {
        }
    };

/**
 * **Texture** — an image file uploaded to the GPU.
 *   new Texture("assets/rgb.jpg", {min_filter: "LINEAR_MIPMAP_LINEAR", wrap: "REPEAT"})
 * min_filter: "NEAREST" | "LINEAR" | "NEAREST_MIPMAP_NEAREST" | ... | "LINEAR_MIPMAP_LINEAR" (default)
 * wrap:       "REPEAT" (default) | "MIRRORED_REPEAT" | "CLAMP_TO_EDGE"
 * For v1 compatibility, the second argument may also be the min_filter string itself.
 * Shapes using an unloaded texture are skipped until `ready` becomes true.
 */
const Texture = tiny.Texture =
    class Texture extends Graphics_Card_Object {
        constructor(filename, options = {}) {
            super();
            if (typeof options === "string") options = {min_filter: options};
            Object.assign(this, {filename, min_filter: "LINEAR_MIPMAP_LINEAR", mag_filter: "LINEAR", wrap: "REPEAT"}, options);
            this.image = new Image();
            this.image.onload = () => {
                this.ready = true;
                // A new image on an existing texture (e.g. a changed src) must be re-uploaded:
                for (const gl of this.gpu_instances.keys()) this.copy_onto_graphics_card(gl, false);
            };
            this.image.onerror = () => console.error(`Texture: could not load image "${filename}".`);
            this.image.crossOrigin = "Anonymous";
            this.image.src = filename;
        }

        copy_onto_graphics_card(context, need_initial_settings = true) {
            const gl = as_gl(context);
            const gpu_instance = super.copy_onto_graphics_card(gl, {texture_buffer_pointer: undefined});
            if (!gpu_instance.texture_buffer_pointer) gpu_instance.texture_buffer_pointer = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, gpu_instance.texture_buffer_pointer);
            if (need_initial_settings) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[this.mag_filter]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.min_filter]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.wrap]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.wrap]);
            }
            if (this.image.complete && this.image.naturalWidth) {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);   // images store row 0 at the top; texture v = 0 is the bottom
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                if (this.min_filter.includes("MIPMAP")) gl.generateMipmap(gl.TEXTURE_2D);
            }
            return gpu_instance;
        }

        // activate(gl, texture_unit): bind this texture to a texture unit for the next draw.
        activate(context, texture_unit = 0) {
            const gl = as_gl(context);
            if (!this.ready) return;
            const gpu_instance = super.activate(gl);
            gl.activeTexture(gl["TEXTURE" + texture_unit]);
            gl.bindTexture(gl.TEXTURE_2D, gpu_instance.texture_buffer_pointer);
        }
    };

/**
 * **Render_Target** — draw into a texture instead of the screen (a framebuffer object).
 * Use it for multi-pass effects: shadow maps, mirrors, post-processing.
 *
 *   this.target = new Render_Target(512, 512);
 *   this.target.bind(webgl_manager);      // subsequent draws go into the texture
 *   ...draw a scene...
 *   this.target.unbind(webgl_manager);    // back to the canvas
 *   material.override({texture: this.target})   // a Render_Target can be used like a Texture
 */
const Render_Target = tiny.Render_Target =
    class Render_Target extends Graphics_Card_Object {
        constructor(width = 512, height = 512, {min_filter = "LINEAR", wrap = "CLAMP_TO_EDGE"} = {}) {
            super();
            Object.assign(this, {width, height, min_filter, wrap, ready: true});
        }

        copy_onto_graphics_card(context) {
            const gl = as_gl(context);
            const gpu_instance = super.copy_onto_graphics_card(gl, {});
            gpu_instance.texture_buffer_pointer = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, gpu_instance.texture_buffer_pointer);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.min_filter]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.wrap]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.wrap]);
            gpu_instance.depth = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, gpu_instance.depth);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, this.width, this.height);
            gpu_instance.framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, gpu_instance.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gpu_instance.texture_buffer_pointer, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, gpu_instance.depth);
            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            if (status !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Render_Target: framebuffer is incomplete (status 0x" + status.toString(16) + ").");
            return gpu_instance;
        }

        // bind(): send draws into this target and clear it.
        bind(webgl_manager, clear_color = [0, 0, 0, 0]) {
            const gl = as_gl(webgl_manager);
            // Create on first use without binding the color texture to a sampler unit (which would be a feedback loop).
            const gpu_instance = Graphics_Card_Object.prototype.activate.call(this, gl);
            gl.bindFramebuffer(gl.FRAMEBUFFER, gpu_instance.framebuffer);
            gl.viewport(0, 0, this.width, this.height);
            gl.clearColor(...clear_color);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        // unbind(): draw to the canvas again (restoring its viewport and clear color).
        unbind(webgl_manager) {
            const gl = as_gl(webgl_manager);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            if (webgl_manager.background_color) gl.clearColor(...webgl_manager.background_color);
        }

        // activate(gl, texture_unit): bind the rendered image for sampling, exactly like Texture.activate().
        activate(context, texture_unit = 0) {
            const gl = as_gl(context);
            const gpu_instance = super.activate(gl);
            gl.activeTexture(gl["TEXTURE" + texture_unit]);
            gl.bindTexture(gl.TEXTURE_2D, gpu_instance.texture_buffer_pointer);
            return gpu_instance;
        }
    };

// ─────────────────────────────────────────────────────────────────────────────────────────
// The program
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * **Program_State** — values shared by every draw in a frame: camera, projection, lights, time.
 *   view_transform        world → camera  (set it with set_camera(); e.g. Mat4.look_at(...))
 *   camera_transform      camera → world  (the inverse, kept in sync; its last column is the eye point)
 *   projection_transform  camera → clip coordinates (Mat4.perspective / orthographic / frustum)
 *   lights                array of Light
 *   animation_time        milliseconds of animated time (stops while `animate` is false)
 *   animation_delta_time  milliseconds since the previous frame
 */
const Program_State = tiny.Program_State =
    class Program_State extends Container {
        constructor(view_transform = Mat4.identity(), projection_transform = Mat4.identity()) {
            super();
            this.set_camera(view_transform);
            Object.assign(this, {projection_transform, lights: [], animate: true, animation_time: 0, animation_delta_time: 0});
        }

        // set_camera(view): store the view matrix (world → camera) and its inverse.
        set_camera(view_transform) {
            Object.assign(this, {view_transform, camera_transform: Mat4.inverse(view_transform)});
        }

        // Keep the camera pair consistent if one of them was edited in place (e.g. by camera controls).
        set_camera_transform(camera_transform) {
            Object.assign(this, {camera_transform, view_transform: Mat4.inverse(camera_transform)});
        }
    };

/**
 * **Webgl_Manager** — owns one canvas: its WebGL 2 context, its Scenes, and the render loop.
 *   gl            the WebGL2RenderingContext
 *   width, height the canvas drawing-buffer size in pixels; aspect_ratio = width / height
 *   scratchpad    an object where scenes may stash things shared across scenes on this canvas
 */
const Webgl_Manager = tiny.Webgl_Manager =
    class Webgl_Manager {
        constructor(canvas, background_color = color(0, 0, 0, 1), {on_error = e => console.error(e)} = {}) {
            Object.assign(this, {
                scenes: [], prev_time: 0, canvas, scratchpad: {}, background_color, on_error,
                program_state: new Program_State()
            });
            this.gl = canvas.getContext("webgl2", {antialias: true});
            if (!this.gl) throw new Error("This browser did not provide WebGL 2, which TinyGraphics.js v2 requires.");
            const gl = this.gl;
            gl.clearColor(...background_color);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            this.resize();
        }

        // v1 code used webgl_manager.context for the GL context; keep that working.
        get context() {
            return this.gl;
        }

        get width() {
            return this.canvas.width;
        }

        get height() {
            return this.canvas.height;
        }

        get aspect_ratio() {
            return this.canvas.width / this.canvas.height;
        }

        // resize(): match the drawing buffer to the canvas's on-screen size (times devicePixelRatio).
        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr)),
                h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
            if (this.canvas.width !== w || this.canvas.height !== h) Object.assign(this.canvas, {width: w, height: h});
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        render(time = 0) {
            const ps = this.program_state;
            ps.animation_delta_time = this.prev_time ? time - this.prev_time : 0;
            if (ps.animate) ps.animation_time += ps.animation_delta_time;
            this.prev_time = time;
            try {
                this.resize();
                const gl = this.gl;
                gl.clearColor(...this.background_color);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                const open_list = [...this.scenes];                     // every scene and its children
                while (open_list.length) {
                    open_list.push(...open_list[0].children);
                    open_list.shift().display(this, ps);
                }
            } catch (error) {
                this.on_error(error);                                    // stop the loop: one error, reported once
                return;
            }
            this.event = window.requestAnimationFrame(this.render.bind(this));
        }
    };

/**
 * **Scene** — base class for your program.  Override:
 *   display(webgl_manager, program_state)   called every frame; draw shapes here
 *   make_control_panel()                    add buttons, sliders and readouts
 *   show_explanation(element)               optional HTML shown below the canvas and controls
 * Scenes may have `children` (other Scenes drawn and controlled alongside them).
 */
const Scene = tiny.Scene =
    class Scene {
        constructor() {
            this.children = [];
            const callback_behavior = (callback, event) => {
                callback(event);
                event.preventDefault();
                event.stopPropagation();
            };
            this.key_controls = new Keyboard_Manager(document, callback_behavior);
        }

        new_line(parent = this.control_panel) {
            parent.appendChild(Object.assign(document.createElement("div"), {className: "tg-break"}));
        }

        // live_string(callback): a text element refreshed every frame, e.g.
        //   this.live_string(box => box.textContent = "t = " + this.t.toFixed(2));
        live_string(callback, parent = this.control_panel) {
            parent.appendChild(Object.assign(document.createElement("div"), {className: "live_string", onload: callback}));
        }

        // key_triggered_button(description, ["Shift", "T"], callback, color, release_callback)
        // The button shows its shortcut as a key cap.  `color`, if given, tints that cap (e.g. to group buttons).
        key_triggered_button(description, shortcut_combination, callback, color,
                             release_event, recipient = this, parent = this.control_panel) {
            const button = parent.appendChild(document.createElement("button"));
            button.type = "button";
            const press = () => {
                    button.classList.add("pressed");
                    callback.call(recipient);
                },
                release = () => {
                    button.classList.remove("pressed");
                    if (release_event) release_event.call(recipient);
                };
            if (shortcut_combination) {
                const names = {" ": "Space", ",": ",", ".": "."};
                const cap = button.appendChild(Object.assign(document.createElement("kbd"),
                    {textContent: shortcut_combination.map(k => names[k] || (k.length === 1 ? k.toUpperCase() : k)).join("+")}));
                if (color) cap.style.background = color;
            }
            button.appendChild(Object.assign(document.createElement("span"), {textContent: description}));
            button.addEventListener("pointerdown", press);
            button.addEventListener("pointerup", release);
            button.addEventListener("pointerleave", () => button.classList.contains("pressed") && release());
            if (shortcut_combination) this.key_controls.add(shortcut_combination, press, release);
            return button;
        }

        // slider(description, {min, max, step, value}, on_change): a labelled range input.
        //   this.slider("field of view", {min: 10, max: 120, value: 45}, v => this.fov = v);
        slider(description, {min = 0, max = 1, step = 0.01, value = 0} = {}, on_change = () => {}, parent = this.control_panel) {
            const label = parent.appendChild(document.createElement("label"));
            label.className = "slider";
            const text = label.appendChild(document.createElement("span"));
            const input = label.appendChild(Object.assign(document.createElement("input"), {type: "range", min, max, step, value}));
            const update = () => {
                const v = parseFloat(input.value);
                text.textContent = `${description}: ${+v.toFixed(4)}`;
                on_change.call(this, v);
            };
            input.addEventListener("input", update);
            update();
            return input;
        }

        display(webgl_manager, program_state) {
        }

        make_control_panel() {
        }

        show_explanation(document_section) {
        }
    };
