// Unit tests for the math and geometry in TinyGraphics.js.  No browser, no dependencies:
//     node tools/test-math.mjs
// Each matrix function is checked against an independent reference implementation written from
// the textbook formulas (not copied from the library), and against the geometric property it
// must have — e.g. a projection must send the near plane to z = −1.
import {tiny, defs} from '../common.js';

const {Vector, Vector3, Vector4, vec3, vec4, Matrix, Mat4, Shape, Program_State} = tiny;

let passed = 0, failed = 0;
const test = (name, fn) => {
    try {
        fn();
        passed++;
    } catch (e) {
        failed++;
        console.log(`FAIL  ${name}\n      ${e.message}`);
    }
};
const close = (a, b, eps = 1e-5) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
const assert = (cond, msg) => {
    if (!cond) throw new Error(msg);
};
const assert_vec = (got, want, what = "vector") => {
    assert(got.length >= want.length && want.every((w, i) => close(got[i], w)),
        `${what}: got [${[...got].map(x => +x.toFixed(6))}], want [${want}]`);
};
const assert_mat = (got, want, what = "matrix") => {
    for (let r = 0; r < want.length; r++)
        for (let c = 0; c < want[0].length; c++)
            assert(close(got[r][c], want[r][c]), `${what}[${r}][${c}]: got ${got[r][c]}, want ${want[r][c]}\n      got ${JSON.stringify(got)}`);
};
const apply_point = (M, p) => {                       // M · (x, y, z, 1), then divide by w
    const q = M.times(vec4(p[0], p[1], p[2], 1));
    return [q[0] / q[3], q[1] / q[3], q[2] / q[3]];
};

// ── Reference implementations (plain arrays, row-major, from the formulas) ───────────────────
const ref = {
    mul: (A, B) => A.map((row, r) => B[0].map((_, c) => row.reduce((s, _, k) => s + A[r][k] * B[k][c], 0))),
    rot: (t, [x, y, z]) => {
        const n = Math.hypot(x, y, z);
        [x, y, z] = [x / n, y / n, z / n];
        // R = cos t · I + sin t · [a]× + (1 − cos t) · a aᵀ
        const K = [[0, -z, y], [z, 0, -x], [-y, x, 0]], a = [x, y, z];
        const R = [0, 1, 2].map(r => [0, 1, 2].map(c =>
            (r === c ? Math.cos(t) : 0) + Math.sin(t) * K[r][c] + (1 - Math.cos(t)) * a[r] * a[c]));
        return [[...R[0], 0], [...R[1], 0], [...R[2], 0], [0, 0, 0, 1]];
    },
};

// ── Vectors ──────────────────────────────────────────────────────────────────────────────────
test("vec3 arithmetic", () => {
    assert_vec(vec3(1, 2, 3).plus(vec3(1, 1, 1)), [2, 3, 4]);
    assert_vec(vec3(1, 0, 0).cross(vec3(0, 1, 0)), [0, 0, 1], "x × y");
    assert(vec3(1, 2, 3).dot(vec3(1, 2, 3)) === 14, "dot");
    assert_vec(vec3(0, 2, 4).mix(vec3(10, 10, 10), .5), [5, 6, 7], "mix");
    assert_vec(vec3(3, 0, 4).normalized(), [.6, 0, .8], "normalized");
});
test("vec4 ignores w in norm, keeps w in normalized", () => {
    const v = vec4(3, 0, 4, 1);
    assert(close(v.norm(), 5), "norm");
    assert_vec(v.normalized(), [.6, 0, .8, 1]);
});
test("Vector (any size) dot and equals", () => {
    assert(Vector.of(1, 2, 3, 4, 5).dot(Vector.of(1, 1, 1, 1, 1)) === 15, "dot");
    assert(!Vector.of(1, 2).equals(Vector.of(1, 2, 3)), "different lengths are not equal");
});
test("Vector4.equals compares all four entries (v1 bug fix)", () => {
    assert(!vec4(1, 2, 3, 4).equals(vec4(1, 2, 3, 5)), "w differs");
});
test("hex_color", () => {
    assert_vec(tiny.hex_color("#ff8000"), [1, 128 / 255, 0, 1]);
});

// ── Matrix basics ────────────────────────────────────────────────────────────────────────────
test("Matrix.times matches reference multiplication", () => {
    const A = Matrix.of([1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]);
    const B = Matrix.of([2, 0, 1, 0], [0, 1, 0, 3], [1, 0, 2, 0], [0, 4, 0, 1]);
    assert_mat(A.times(B), ref.mul(A, B));
});
test("transposed and column_major agree", () => {
    const A = Matrix.of([1, 2, 3], [4, 5, 6]);
    assert_mat(A.transposed(), [[1, 4], [2, 5], [3, 6]]);
    assert_vec(Matrix.column_major(A), [1, 4, 2, 5, 3, 6]);
    assert_vec(Matrix.column_major(Mat4.translation(7, 8, 9)).slice(12), [7, 8, 9, 1], "translation lives in the last column");
});

// ── Mat4 generators ──────────────────────────────────────────────────────────────────────────
test("translation / scale accept numbers or a vector", () => {
    assert_mat(Mat4.translation(1, 2, 3), Mat4.translation(vec3(1, 2, 3)));
    assert_mat(Mat4.scale([2, 3, 4]), [[2, 0, 0, 0], [0, 3, 0, 0], [0, 0, 4, 0], [0, 0, 0, 1]]);
});
test("rotation matches Rodrigues' formula for several axes", () => {
    for (const [t, axis] of [[.3, [0, 0, 1]], [1.1, [1, 0, 0]], [-2, [0, 1, 0]], [.7, [1, 2, 3]]]) {
        assert_mat(Mat4.rotation(t, ...axis), ref.rot(t, axis), `rotation(${t}, ${axis})`);
        assert_mat(Mat4.rotation(t, vec3(...axis)), ref.rot(t, axis), "vector-axis form");
    }
});
test("rotation is right-handed: +90° about z takes x to y", () => {
    assert_vec(Mat4.rotation(Math.PI / 2, 0, 0, 1).times(vec4(1, 0, 0, 0)), [0, 1, 0, 0]);
});
test("transformation order: T·R differs from R·T", () => {
    const T = Mat4.translation(2, 0, 0), R = Mat4.rotation(Math.PI / 2, 0, 0, 1);
    assert_vec(apply_point(T.times(R), [1, 0, 0]), [2, 1, 0], "T·R: rotate first");
    assert_vec(apply_point(R.times(T), [1, 0, 0]), [0, 3, 0], "R·T: translate first");
});
test("inverse · M = identity", () => {
    const M = Mat4.translation(1, -2, 3).times(Mat4.rotation(.8, 1, 1, 0)).times(Mat4.scale(2, .5, 3));
    assert_mat(Mat4.inverse(M).times(M), Mat4.identity());
});
test("inverse of a singular matrix throws a helpful error", () => {
    let threw = false;
    try {
        Mat4.inverse(Mat4.scale(1, 0, 1));
    } catch (e) {
        threw = /singular/.test(e.message);
    }
    assert(threw, "expected a 'singular' error");
});

// ── Camera and projection ────────────────────────────────────────────────────────────────────
test("look_at: eye → origin, at → −z axis, up stays in the y–z plane", () => {
    const eye = vec3(3, 4, 5), at = vec3(0, 1, 0), V = Mat4.look_at(eye, at, vec3(0, 1, 0));
    assert_vec(apply_point(V, eye), [0, 0, 0], "eye");
    const a = apply_point(V, at), d = Math.hypot(3, 3, 5);
    assert_vec(a, [0, 0, -d], "at is straight ahead");
    assert(close(V.times(vec4(0, 1, 0, 0))[0], 0), "world up has no sideways component");
});
test("look_at worked example: camera at (−10,0,0) looking at the origin", () => {
    const V = Mat4.look_at(vec3(-10, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0));
    assert_mat(V, [[0, 0, 1, 0], [0, 1, 0, 0], [-1, 0, 0, -10], [0, 0, 0, 1]]);
    assert_vec(apply_point(V, [1, 1, 1]), [1, 1, -11]);
});
test("look_at with up parallel to the view direction throws", () => {
    let threw = false;
    try {
        Mat4.look_at(vec3(0, 5, 0), vec3(0, 0, 0), vec3(0, 1, 0));
    } catch (e) {
        threw = true;
    }
    assert(threw, "expected an error");
});
test("orthographic maps the box corners to the NDC cube (v1 returned NaN)", () => {
    const [l, r, b, t, n, f] = [-10, 10, -5, 15, 1, 21], P = Mat4.orthographic(l, r, b, t, n, f);
    assert_vec(apply_point(P, [l, b, -n]), [-1, -1, -1], "near-bottom-left");
    assert_vec(apply_point(P, [r, t, -f]), [1, 1, 1], "far-top-right");
    assert_vec(apply_point(P, [1, 5, -11]), [.1, 0, 0], "a point in the middle");
});
test("perspective: near plane → −1, far plane → +1, edges of the view → ±1", () => {
    const fovy = Math.PI / 3, aspect = 1.5, n = .5, f = 50, P = Mat4.perspective(fovy, aspect, n, f);
    const top = n * Math.tan(fovy / 2), right = top * aspect;
    assert_vec(apply_point(P, [right, top, -n]), [1, 1, -1], "near top-right corner");
    const T = f * Math.tan(fovy / 2);
    assert_vec(apply_point(P, [-T * aspect, -T, -f]), [-1, -1, 1], "far bottom-left corner");
});
test("perspective equals the symmetric frustum", () => {
    const t = 1 * Math.tan(Math.PI / 8);
    assert_mat(Mat4.perspective(Math.PI / 4, 2, 1, 100), Mat4.frustum(-2 * t, 2 * t, -t, t, 1, 100));
});
test("frustum handles an off-center window", () => {
    const P = Mat4.frustum(0, 2, -1, 3, 1, 10);
    assert_vec(apply_point(P, [0, -1, -1]), [-1, -1, -1]);
    assert_vec(apply_point(P, [20, 30, -10]), [1, 1, 1]);
});
test("perspective worked example: (1,1,−11) with fovy 90°, aspect 1, near 1, far 21", () => {
    assert_vec(apply_point(Mat4.perspective(Math.PI / 2, 1, 1, 21), [1, 1, -11]), [1 / 11, 1 / 11, 10 / 11]);
});
test("Program_State keeps view and camera transforms inverse to each other", () => {
    const ps = new Program_State();
    ps.set_camera(Mat4.look_at(vec3(1, 2, 3), vec3(0, 0, 0), vec3(0, 1, 0)));
    assert_mat(ps.view_transform.times(ps.camera_transform), Mat4.identity());
    assert_vec(ps.camera_transform.times(vec4(0, 0, 0, 1)), [1, 2, 3, 1], "camera_transform's origin is the eye");
    assert(Array.isArray(ps.lights) && ps.lights.length === 0, "lights default to []");
});

// ── Normals ──────────────────────────────────────────────────────────────────────────────────
test("normal_matrix keeps normals perpendicular under non-uniform scale and rotation", () => {
    const M = Mat4.rotation(.9, 0, 1, 1).times(Mat4.scale(4, 1, .25)).times(Mat4.rotation(.3, 1, 0, 0));
    const N = Mat4.normal_matrix(M);
    const tangent = vec4(1, -1, 0, 0), normal = vec3(1, 1, 0);       // perpendicular on the untransformed surface
    const t2 = M.times(tangent), n2 = N.times(normal);
    assert(close(t2[0] * n2[0] + t2[1] * n2[1] + t2[2] * n2[2], 0), "transformed normal is not perpendicular to transformed tangent");
    const naive = M.times(normal.to4(0));
    assert(!close(t2.dot(naive), 0, 1e-3), "sanity: the model matrix itself would NOT keep it perpendicular");
});
test("normal_matrix of a pure rotation is the rotation", () => {
    const R = Mat4.rotation(1.3, 2, -1, .5);
    assert_mat(Mat4.normal_matrix(R), R.sub_block([0, 0], [3, 3]));
});

// ── Shapes ───────────────────────────────────────────────────────────────────────────────────
const unit_normals = (shape, name) => shape.arrays.normal.forEach((n, i) =>
    assert(close(Math.hypot(n[0], n[1], n[2]), 1, 1e-3), `${name}: normal ${i} has length ${Math.hypot(...n)}`));
const indices_in_range = (shape, name) => {
    const count = shape.arrays.position.length;
    for (const [k, arr] of Object.entries(shape.arrays))
        assert(arr.length === count, `${name}: array "${k}" has ${arr.length} entries, position has ${count}`);
    assert(shape.indices.every(i => i >= 0 && i < count), `${name}: an index is out of range`);
};

test("every stock shape builds, with matching array lengths and in-range indices", () => {
    const builds = {
        Triangle: [], Square: [], Tetrahedron: [true], Windmill: [5], Cube: [], Subdivision_Sphere: [3],
        Torus: [8, 8, [[0, 2], [0, 1]]], Grid_Sphere: [8, 8, [[0, 2], [0, 1]]], Regular_2D_Polygon: [1, 7],
        Cylindrical_Tube: [3, 9, [[0, 1], [0, 1]]], Cone_Tip: [3, 9, [[0, 1], [0, 1]]], Closed_Cone: [4, 10, [[0, 2], [0, 1]]],
        Rounded_Closed_Cone: [4, 10, [[0, 2], [0, 1]]], Capped_Cylinder: [4, 12, [[0, 2], [0, 1]]],
        Rounded_Capped_Cylinder: [4, 12, [[0, 2], [0, 1]]], Axis_Arrows: [],
    };
    for (const [name, args] of Object.entries(builds)) indices_in_range(new defs[name](...args), name);
});
test("Tetrahedron builds in both modes (v1 threw: Vec is not defined)", () => {
    indices_in_range(new defs.Tetrahedron(false), "smooth tetrahedron");
    indices_in_range(new defs.Tetrahedron(true), "flat tetrahedron");
});
test("sphere normals are unit length and point outward", () => {
    const s = new defs.Subdivision_Sphere(3);
    unit_normals(s, "Subdivision_Sphere");
    s.arrays.position.forEach((p, i) => assert(p.dot(s.arrays.normal[i]) > .99, `normal ${i} does not point outward`));
});
test("Cube: compound shape with 6 faces of outward unit normals (checks insert_transformed_copy_into)", () => {
    const c = new defs.Cube();
    assert(c.arrays.position.length === 24 && c.indices.length === 36, "24 vertices, 12 triangles");
    unit_normals(c, "Cube");
    c.arrays.position.forEach((p, i) => assert(close(p.dot(c.arrays.normal[i]), 1), `vertex ${i}: normal is not the face normal`));
});
test("insert_transformed_copy_into: translation does not affect normals", () => {
    class Holder extends Shape {
        constructor() {
            super("position", "normal", "texture_coord");
            defs.Square.insert_transformed_copy_into(this, [], Mat4.translation(5, 5, 5).times(Mat4.scale(1, 3, 1)));
        }
    }
    const h = new Holder();
    h.arrays.normal.forEach(n => assert_vec(n, [0, 0, 1], "normal"));
});
test("make_flat_shaded_version gives each triangle its own face normal", () => {
    const Flat = defs.Subdivision_Sphere.prototype.make_flat_shaded_version();
    const s = new Flat(2);
    for (let i = 0; i < s.indices.length; i += 3) {
        const [a, b, c] = [0, 1, 2].map(k => s.indices[i + k]);
        assert_vec(s.arrays.normal[b], [...s.arrays.normal[a]], "same normal on one triangle");
        assert_vec(s.arrays.normal[c], [...s.arrays.normal[a]], "same normal on one triangle");
        const e1 = s.arrays.position[b].minus(s.arrays.position[a]);
        assert(close(e1.dot(s.arrays.normal[a]), 0, 1e-4), "face normal is perpendicular to an edge");
    }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
