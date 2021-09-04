import {Vector4} from "./Vector.js";

/**
 * **Color** is an alias for class Vector4.  Colors should be made as special 4x1
 * vectors expressed as ( red, green, blue, opacity ) each ranging from 0 to 1.
 */
class Color extends Vector4 {
    /**
     * Color from float point numbers between 0 and 1
     * @param r
     * @param g
     * @param b
     * @param a
     * @returns {Vector4}
     */
    static create_from_float(r, g, b, a) {
        const v = new Vector4(4);
        v[0] = r;
        v[1] = g;
        v[2] = b;
        v[3] = a;
        return v;
    }

    /**
     * Create color from hexadecimal numbers, e.g., #FFFFFF
     * @param hex
     * @param alpha
     * @returns {Vector4}
     */
    static create_from_hex(hex, alpha = 1.) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        const v = new Vector4(4);
        if (result) {
            v[0] = parseInt(result[1], 16) / 255.;
            v[1] = parseInt(result[2], 16) / 255.;
            v[2] = parseInt(result[3], 16) / 255.;
            v[3] = alpha;
        }
        return v;
    }
}

const color = Color.create_from_float;
const hex_color = Color.create_from_hex;

export {Color, color, hex_color};