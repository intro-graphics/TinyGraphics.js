/**
 * **Vector** stores vectors of floating point numbers.  Puts vector math into JavaScript.
 * @Note  Vectors should be created with of() due to wierdness with the TypedArray spec.
 * @Tip Assign Vectors with .copy() to avoid referring two variables to the same Vector object.
 */
class Vector extends Float32Array {
    /**
     * Create a Vector from float array
     * @param arr
     * @returns {Vector}
     */
    static create(...arr) {
        return new Vector(arr);
    }

    /**
     *  For compact syntax when declaring lists.
     */
    static cast(...args) {
        return args.map(x => Vector.from(x));
    }

    copy() {
        return new Vector(this);
    }

    equals(b) {
        return this.every((x, i) => x === b[i]);
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

    /**
     * Return the normalized unit vector
     * @returns {Float32Array}
     */
    normalized() {
        return this.times(1 / this.norm());
    }

    /**
     * Normalize the vector to a unit vector
     */
    normalize() {
        this.scale_by(1 / this.norm());
    }

    dot(b) {
        // Optimize for Vectors of size 2
        if (this.length === 2)
            return this[0] * b[0] + this[1] * b[1];
        return this.reduce((acc, x, i) => {
            return acc + x * b[i];
        }, 0);
    }


    to3() {
        // to3() / to4() / cross():  For standardizing the API with Vector3/Vector4,
        // so the performance hit of changing between these types can be measured.
        return vec3(this[0], this[1], this[2]);
    }

    to4(is_a_point) {
        return vec4(this[0], this[1], this[2], +is_a_point);
    }

    /**
     * Cross with another three-dimensional vector
     * @param b
     * @returns {Vector3}
     */
    cross(b) {
        return vec3(this[1] * b[2] - this[2] * b[1],
            this[2] * b[0] - this[0] * b[2],
            this[0] * b[1] - this[1] * b[0]);
    }

    to_string() {
        return "[vector " + this.join(", ") + "]";
    }
}

class Vector3 extends Float32Array {
    // **Vector3** is a specialization of Vector only for size 3, for performance reasons.
    static create(x, y, z) {
        const v = new Vector3(3);
        v[0] = x;
        v[1] = y;
        v[2] = z;
        return v;
    }

    static cast(...args) {
        // cast(): Converts a bunch of arrays into a bunch of vec3's.
        return args.map(x => Vector3.from(x));
    }

    /**
     * returns vec3s only meant to be consumed immediately. Aliases into
     * shared memory, to be overwritten upon next unsafe3 call. Faster.
     * @param x
     * @param y
     * @param z
     * @returns {*}
     */
    static unsafe(x, y, z) {
        const shared_memory = vec3(0, 0, 0);
        Vector3.unsafe = (x, y, z) => {
            shared_memory[0] = x;
            shared_memory[1] = y;
            shared_memory[2] = z;
            return shared_memory;
        };
        return Vector3.unsafe(x, y, z);
    }

    copy() {
        return Vector3.from(this);
    }

    /**
     * In-fix operations: Use these for more readable math expressions.
     * @param b
     * @returns {boolean}
     */
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

    // Pre-fix operations: Use these for better performance (to avoid new allocation).
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

    // Other operations:
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
        const d = 1 / this.norm();
        this[0] *= d;
        this[1] *= d;
        this[2] *= d;
    }

    dot(b) {
        return this[0] * b[0] + this[1] * b[1] + this[2] * b[2];
    }

    cross(b) {
        return vec3(this[1] * b[2] - this[2] * b[1],
            this[2] * b[0] - this[0] * b[2],
            this[0] * b[1] - this[1] * b[0]);
    }

    to4(is_a_point)
    // to4():  Convert to a homogeneous vector of 4 values.
    {
        return vec4(this[0], this[1], this[2], +is_a_point);
    }

    to_string() {
        return "[vec3 " + this.join(", ") + "]";
    }
}

class Vector4 extends Float32Array {
    // **Vector4** is a specialization of Vector only for size 4, for performance reasons.
    // The fourth coordinate value is homogenized (0 for a vector, 1 for a point).
    static create(x, y, z, w) {
        const v = new Vector4(4);
        v[0] = x;
        v[1] = y;
        v[2] = z;
        v[3] = w;
        return v;
    }

    /**
     *  **unsafe** Returns vec3s to be used immediately only. Aliases into
     * shared memory to be overwritten on next unsafe3 call.  Faster.
     * @param x
     * @param y
     * @param z
     * @param w
     */
    static unsafe(x, y, z, w) {
        const shared_memory = vec4(0, 0, 0, 0);
        Vector4.unsafe = (x, y, z, w) => {
            shared_memory[0] = x;
            shared_memory[1] = y;
            shared_memory[2] = z;
            shared_memory[3] = w;
        };
    }

    copy() {
        return Vector4.from(this);
    }

    /**
     * In-fix operations: Use these for more readable math expressions.
     * @param b
     * @returns {boolean}
     */
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

    /**
     * Pre-fix operations: Use these for better performance (to avoid new allocation).
     * @param b
     */
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

    // Other operations:
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
        // The norms should behave like for Vector3 because of the homogenous format.
        return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
    }

    normalized() {
        const d = 1 / this.norm();
        return vec4(this[0] * d, this[1] * d, this[2] * d, this[3]);
        // (leaves the 4th coord alone)
    }

    normalize() {
        const d = 1 / this.norm();
        this[0] *= d;
        this[1] *= d;
        this[2] *= d;
        // (leaves the 4th coord alone)
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
}

const vec = Vector.create;
const vec3 = Vector3.create;
const vec4 = Vector4.create;
const unsafe3 = Vector3.unsafe;
const unsafe4 = Vector4.unsafe;

export {Vector, Vector3, Vector4, vec, vec3, vec4, unsafe3, unsafe4};
