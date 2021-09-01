import {GraphicsCardObject} from "../utils.js";

class Texture extends GraphicsCardObject {
    // **Texture** wraps a pointer to a new texture image where
    // it is stored in GPU memory, along with a new HTML image object.
    // This class initially copies the image to the GPU buffers,
    // optionally generating mip maps of it and storing them there too.
    constructor(filename, min_filter = "LINEAR_MIPMAP_LINEAR") {
        super();
        Object.assign(this, {filename, min_filter});
        // Create a new HTML Image object:
        this.image = new Image();
        this.image.onload = () => this.ready = true;
        this.image.crossOrigin = "Anonymous";           // Avoid a browser warning.
        this.image.src = filename;
    }

    copyOntoGraphicsCard(context, need_initial_settings = true) {
        // copyOntoGraphicsCard():  Called automatically as needed to load the
        // texture image onto one of your GPU contexts for its first time.

        // Define what this object should store in each new WebGL Context:
        const initialGpuRepresentation = {texture_buffer_pointer: undefined};
        // Our object might need to register to multiple GPU contexts in the case of
        // multiple drawing areas.  If this is a new GPU context for this object,
        // copy the object to the GPU.  Otherwise, this object already has been
        // copied over, so get a pointer to the existing instance.
        const gpuInstance = super.copyOntoGraphicsCard(context, initialGpuRepresentation);

        if (!gpuInstance.texture_buffer_pointer) gpuInstance.texture_buffer_pointer = context.createTexture();

        const gl = context;
        gl.bindTexture(gl.TEXTURE_2D, gpuInstance.texture_buffer_pointer);

        if (need_initial_settings) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // Always use bi-linear sampling when zoomed out.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.min_filter]);
            // Let the user to set the sampling method
            // when zoomed in.
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
        if (this.min_filter == "LINEAR_MIPMAP_LINEAR")
            gl.generateMipmap(gl.TEXTURE_2D);
        // If the user picked tri-linear sampling (the default) then generate
        // the necessary "mips" of the texture and store them on the GPU with it.
        return gpuInstance;
    }

    activate(context, texture_unit = 0) {
        // activate(): Selects this Texture in GPU memory so the next shape draws using it.
        // Optionally select a texture unit in case you're using a shader with many samplers.
        // Terminate draw requests until the image file is actually loaded over the network:
        if (!this.ready)
            return;
        const gpuInstance = super.activate(context);
        context.activeTexture(context["TEXTURE" + texture_unit]);
        context.bindTexture(context.TEXTURE_2D, gpuInstance.texture_buffer_pointer);
    }
}

export {Texture}