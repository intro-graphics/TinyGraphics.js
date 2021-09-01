import {PhongShader} from "./PhongShader.js";
import texturePhongFrag from "./GLSL/textured_phong_frag.glsl.js"
import texturePhongVert from "./GLSL/textured_phong_vert.glsl.js"
import fakeBump from "./GLSL/fake_bump_mappin_frag.glsl.js"

/**
 * **TexturedPhong** is a Phong Shader extended to additionally decal a
 * texture image over the drawn shape, lined up according to the texture
 * coordinates that are stored at each shape vertex.
 */

class TexturedPhong extends PhongShader {
    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return texturePhongVert;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return texturePhongFrag;
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Add a little more to the base class's version of this method.
        super.update_GPU(context, gpu_addresses, gpu_state, model_transform, material);

        if (material.texture && material.texture.ready) {
            // Select texture unit 0 for the fragment shader Sampler2D uniform called "texture":
            context.uniform1i(gpu_addresses.texture, 0);
            // For this draw, use the texture image from correct the GPU buffer:
            material.texture.activate(context);
        }
    }
}


class FakeBumpMap extends TexturedPhong {
    // **FakeBumpMap** Same as Phong_Shader, except adds a line of code to
    // compute a new normal vector, perturbed according to texture color.
    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        return fakeBump;
    }
}

export {TexturedPhong, FakeBumpMap}