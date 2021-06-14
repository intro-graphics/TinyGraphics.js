class Light {
    // **Light** stores the properties of one light in a scene.  Contains a coordinate and a
    // color (each are 4x1 Vectors) as well as one size scalar.
    // The coordinate is homogeneous, and so is either a point or a vector.  Use w=0 for a
    // vector (directional) light, and w=1 for a point light / spotlight.
    // For spotlights, a light also needs a "size" factor for how quickly the brightness
    // should attenuate (reduce) as distance from the spotlight increases.
    constructor(position, color, size) {
        Object.assign(this, {position, color, attenuation: 1 / size});
    }
}

export {Light}