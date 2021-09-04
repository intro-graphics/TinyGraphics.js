import {vec3, vec4, Vector4} from "./Vector.js";

class Matrix extends Array {
    /**
     * **Matrix** holds M by N matrices of floats.  Enables matrix and vector math.
     "Matrix( rows )" returns a Matrix with those rows, where rows is an array of float arrays.
     * @param args rows
     */
    constructor(...args) {
        super(0);
        this.push(...args);
    }

    static flatten2dTo1D(M) {
        let index = 0, floats = new Float32Array(M.length && M.length * M[0].length);
        for (let i = 0; i < M.length; i++) for (let j = 0; j < M[i].length; j++) floats[index++] = M[i][j];
        return floats;
    }

    /**
     * Push a 2D Array to the matrix
     * @param M
     */
    set(M) {
        this.length = 0;
        this.push(...M);
    }

    /**
     * Assigns the m by n identity to Matrix M.
     * @param m row number
     * @param n column number
     */
    setIdentity(m, n) {
        this.length = 0;
        for (let i = 0; i < m; i++) {
            this.push(Array(n).fill(0));
            if (i < n) this[i][i] = 1;
        }
    }

    /**
     * "M.subBlock( start, end )" where start and end are each a [ row, column ] pair returns a sub-rectangle cut out from M.
     * @param start
     * @param end
     * @returns {*}
     */
    subBlock(start, end) {
        return Matrix.from(this.slice(start[0], end[0]).map(r => r.slice(start[1], end[1])));
    }

    /**
     * Creates a deep copy of M and returns it so you can modify it without affecting the original.
     * @returns {*[][]}
     */
    copy() {
        return this.map(r => [...r]);
    }

    /**
     * "M.equals(b)", "M.plus(b)", and "M.minus(b)" are operations between two matrices.
     * @param b another matrix to be compared with
     * @returns {this is T[]} Boolean number
     */
    equals(b) {
        return this.every((r, i) => r.every((x, j) => x === b[i][j]));
    }

    /**
     * "M.equals(b)", "M.plus(b)", and "M.minus(b)" are operations between two matrices.
     * @param b
     * @returns {*[]}
     */
    plus(b) {
        return this.map((r, i) => r.map((x, j) => x + b[i][j]));
    }

    /**
     * "M.equals(b)", "M.plus(b)", and "M.minus(b)" are operations between two matrices.
     * @param b
     * @returns {*[]}
     */
    minus(b) {
        return this.map((r, i) => r.map((x, j) => x - b[i][j]));
    }

    /**
     * Transpose the matrix and create new one
     * @returns {*[]}
     */
    transposed() {
        return this.map((r, i) => r.map((x, j) => this[j][i]));
    }

    /**
     * "M.times(b)" (where the post-multiplied b can be a scalar, a Vector4, or another Matrix) returns a
     new Matrix or Vector4 holding the product.
     * @param b
     * @param optional_preallocated_result
     * @returns {*|Vector4|*[]}
     */
    times(b, optional_preallocated_result) {
        const len = b.length;
        if (typeof len === "undefined") return this.map(r => r.map(x => b * x));
        // Matrix * scalar case.
        const len2 = b[0].length;
        if (typeof len2 === "undefined") {
            let result = optional_preallocated_result || new Vector4(this.length);
            // Matrix * Vector4 case.
            for (let r = 0; r < len; r++) result[r] = b.dot(this[r]);
            return result;
        }
        let result = optional_preallocated_result || Matrix.from(new Array(this.length));
        for (let r = 0; r < this.length; r++) {
            // Matrix * Matrix case.
            if (!optional_preallocated_result)
                result[r] = new Array(len2);
            for (let c = 0; c < len2; c++) {
                result[r][c] = 0;
                for (let r2 = 0; r2 < len; r2++)
                    result[r][c] += this[r][r2] * b[r2][c];
            }
        }
        return result;
    }

    /**
     * "M.pre_multiply(b)"  overwrites the Matrix M with the product of b * M where b must be another Matrix.
     * @param b
     * @returns {Matrix}
     */
    pre_multiply(b) {
        const new_value = b.times(this);
        this.length = 0;
        this.push(...new_value);
        return this;
    }

    /**
     * "M.postMultiply(b)" overwrites the Matrix M with the product of M * b where b can be a Matrix or scalar.
     * @param b
     * @returns {Matrix}
     */
    postMultiply(b) {
        const new_value = this.times(b);
        this.length = 0;
        this.push(...new_value);
        return this;
    }

    /**
     * "M.to_string()" where M contains the 4x4 identity returns "[[1, 0, 0, 0] [0, 1, 0, 0] [0, 0, 1, 0] [0, 0, 0, 1]]".
     * @returns {string}
     */
    to_string() {
        return "[" + this.map((r, i) => "[" + r.join(", ") + "]").join(" ") + "]";
    }
}

class Mat4 extends Matrix {
    /**
     * Generate a 4x4 identity matrix
     * @returns {*}
     */
    static identity() {
        return Matrix.of([1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]);
    };

    /**
     * Create a rotation matrix with the rotation angle and axis
     * @param angle angle in radian
     * @param x
     * @param y
     * @param z
     * @returns {*}
     */
    static rotation(angle, x, y, z) {
        // rotation(): Requires a scalar (angle) and a three-component axis vector.
        const normalize = (x, y, z) => {
            const n = Math.sqrt(x * x + y * y + z * z);
            return [x / n, y / n, z / n];
        };
        let [i, j, k] = normalize(x, y, z),
            [c, s] = [Math.cos(angle), Math.sin(angle)],
            omc = 1.0 - c;
        return Matrix.of([i * i * omc + c, i * j * omc - k * s, i * k * omc + j * s, 0],
            [i * j * omc + k * s, j * j * omc + c, j * k * omc - i * s, 0],
            [i * k * omc - j * s, j * k * omc + i * s, k * k * omc + c, 0],
            [0, 0, 0, 1]);
    }

    /**
     * Create a scaling matrix
     * @param x
     * @param y
     * @param z
     * @returns {*}
     */
    static scale(x, y, z) {
        // scale(): Builds and returns a scale matrix using x,y,z.
        return Matrix.of([x, 0, 0, 0],
            [0, y, 0, 0],
            [0, 0, z, 0],
            [0, 0, 0, 1]);
    }

    /**
     * Create a translation matrix
     * @param x
     * @param y
     * @param z
     * @returns {*}
     */
    static translation(x, y, z) {
        // translation(): Builds and returns a translation matrix using x,y,z.
        return Matrix.of([1, 0, 0, x],
            [0, 1, 0, y],
            [0, 0, 1, z],
            [0, 0, 0, 1]);
    }

    /**
     * Produce a traditional graphics camera "lookat" matrix.
     * Each input must be a 3x1 Vector.
     * Note:  look_at() assumes the result will be used for a camera and stores its
     * result in inverse space.
     * If you want to use look_at to point a non-camera towards something, you can
     * do so, but to generate the correct basis you must re-invert its result.
     * @param eye
     * @param at
     * @param up
     * @returns {*}
     */
    static look_at(eye, at, up) {
        // Compute vectors along the requested coordinate axes. "y" is the "updated" and orthogonalized local y axis.
        let z = at.minus(eye).normalized(),
            x = z.cross(up).normalized(),
            y = x.cross(z).normalized();

        // Check for NaN, indicating a degenerate cross product, which
        // happens if eye == at, or if at minus eye is parallel to up.
        if (!x.every(i => i === i))
            throw "Two parallel vectors were given";
        z.scale_by(-1);                               // Enforce right-handed coordinate system.
        return Mat4.translation(-x.dot(eye), -y.dot(eye), -z.dot(eye))
            .times(Matrix.of(x.to4(0), y.to4(0), z.to4(0), vec4(0, 0, 0, 1)));
    }

    /**
     * Create Box-shaped view volume for projection.
     * @param left
     * @param right
     * @param bottom
     * @param top
     * @param near
     * @param far
     * @returns {*}
     */
    static orthographic(left, right, bottom, top, near, far) {
        return Mat4.scale(vec3(1 / (right - left), 1 / (top - bottom), 1 / (far - near)))
            .times(Mat4.translation(vec3(-left - right, -top - bottom, -near - far)))
            .times(Mat4.scale(vec3(2, 2, -2)));
    }

    /**
     * Frustum-shaped view volume for projection.
     * @param fov_y
     * @param aspect
     * @param near
     * @param far
     * @returns {*}
     */
    static perspective(fov_y, aspect, near, far) {
        const f = 1 / Math.tan(fov_y / 2), d = far - near;
        return Matrix.of([f / aspect, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, -(near + far) / d, -2 * near * far / d],
            [0, 0, -1, 0]);
    }

    /**
     * A 4x4 inverse.  Computing it is slow because of
     * the amount of steps; call fewer times when possible.
     * @param m
     * @returns {*}
     */
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
        // Divide by determinant and return.
        return result.times(1 / (m00 * result[0][0] + m10 * result[0][1] + m20 * result[0][2] + m30 * result[0][3]));
    }
}

export {Matrix, Mat4};