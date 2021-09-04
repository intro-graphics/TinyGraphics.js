/**
 * ** GraphicsCardObject** Extending this base class allows an object to
 * copy itself onto a WebGL context on demand, whenever it is first used for
 * a GPU draw command on a context it hasn't seen before.
 */
import {Mat4, Matrix} from "./math/Matrix.js";

class GraphicsCardObject {
    constructor() {
        this.gpu_instances = new Map();
    }

    /**
     * Our object might need to register to multiple
     * GPU contexts in the case of multiple drawing areas.  If this is a new GPU
     * context for this object, copy the object to the GPU.  Otherwise, this
     * object already has been copied over, so get a pointer to the existing
     * instance.  The instance consists of whatever GPU pointers are associated
     * with this object, as returned by the WebGL calls that copied it to the
     * GPU.  GPU-bound objects should override this function, which builds an
     * initial instance, so as to populate it with finished pointers.
     * @param context GPU contexts this object has copied itself onto.
     * @param initialGpuRepresentation
     * @returns {any}
     */
    copyOntoGraphicsCard(context, initialGpuRepresentation) {
        const existingInstance = this.gpu_instances.get(context);
        // Warn the user if they are avoidably making too many GPU objects.  Beginner
        // WebGL programs typically only need to call copyOntoGraphicsCard once
        // per object; doing it more is expensive, so warn them with an "idiot
        // alarm". Don't trigger the idiot alarm if the user is correctly re-using
        // an existing GPU context and merely overwriting parts of itself.
        if (!existingInstance) {
            GraphicsCardObject.idiot_alarm |= 0;     // Start a program-wide counter.
            if (GraphicsCardObject.idiot_alarm++ > 200)
                throw `Error: You are sending a lot of object definitions to the GPU, probably by mistake!  
                    Many of them are likely duplicates, which you don't want since sending each one is very slow.  
                    To avoid this, from your display() function avoid ever declaring a Shape Shader or Texture (or 
                    subclass of these) with "new", thus causing the definition to be re-created and re-transmitted every
                    frame. Instead, call these in your scene's constructor and keep the result as a class member, 
                    or otherwise make sure it only happens once.  In the off chance that you have a somehow deformable 
                    shape that MUST change every frame, then at least use the special arguments of 
                    copyOntoGraphicsCard to limit which buffers get overwritten every frame to only 
                    the necessary ones.`;
        }
        // Check if this object already exists on that GPU context.
        // If necessary, start a new object associated with the context.
        return existingInstance || this.gpu_instances.set(context, initialGpuRepresentation).get(context);
    }

    /**
     * To use, super call it to retrieve a container of GPU
     * pointers associated with this object.  If none existed one will be created.
     * Then do any WebGL calls you need that require GPU pointers.
     * @param context
     * @param args
     * @returns {any}
     */
    activate(context, ...args) {
        return this.gpu_instances.get(context) || this.copyOntoGraphicsCard(context, ...args);
    }
}

/**
 * Organizes data related to one 3D shape and copies it into GPU memory.  That data
 * is broken down per vertex in the shape.
 *
 * To use, make a subclass of it that overrides the
 * constructor and fills in the "arrays" property.  Within "arrays", you can make several fields that
 * you can look up in a vertex; for each field, a whole array will be made here of that data type and
 * it will be indexed per vertex.  Along with those lists is an additional array "indices" describing
 * how vertices are connected to each other into shape primitives.  Primitives could includes
 * triangles, expressed as triples of vertex indices.
 */
class VertexBuffer extends GraphicsCardObject {
    constructor(...arrayNames) {
        // This superclass constructor expects a list of names of arrays that you plan for.
        super();
        this.arrays = {};
        this.indices = [];
        // Initialize a blank array member of the Shape with each of the names provided:
        for (let name of arrayNames) this.arrays[name] = [];
    }

    /**
     * Called automatically as needed to load this vertex array set onto
     * one of your GPU contexts for its first time.  Send the completed vertex and index lists to
     * their own buffers within any of your existing graphics card contexts.  Optional arguments
     * allow calling this again to overwrite the GPU buffers related to this shape's arrays, or
     * subsets of them as needed (if only some fields of your shape have changed).
     * @param context
     * @param selectionOfArrays
     * @param writeToIndices
     * @returns {*}
     */
    copyOntoGraphicsCard(context, selectionOfArrays = Object.keys(this.arrays), writeToIndices = true) {
        // Define what this object should store in each new WebGL Context:
        const initialGpuRepresentation = {webGL_buffer_pointers: {}};
        // Our object might need to register to multiple GPU contexts in the case of
        // multiple drawing areas.  If this is a new GPU context for this object,
        // copy the object to the GPU.  Otherwise, this object already has been
        // copied over, so get a pointer to the existing instance.
        const didExist = this.gpu_instances.get(context);
        const gpuInstance = super.copyOntoGraphicsCard(context, initialGpuRepresentation);

        const gl = context;

        const write = didExist ? (target, data) => gl.bufferSubData(target, 0, data)
            : (target, data) => gl.bufferData(target, data, gl.STATIC_DRAW);

        for (let name of selectionOfArrays) {
            if (!didExist)
                gpuInstance.webGL_buffer_pointers[name] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, gpuInstance.webGL_buffer_pointers[name]);
            write(gl.ARRAY_BUFFER, Matrix.flatten2dTo1D(this.arrays[name]));
        }
        if (this.indices.length && writeToIndices) {
            if (!didExist)
                gpuInstance.index_buffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuInstance.index_buffer);
            write(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));
        }
        return gpuInstance;
    }

    /**
     * Draws this shape's entire vertex buffer.
     * @param gl
     * @param gpuInstance
     * @param type
     */
    executeShaders(gl, gpuInstance, type) {
        // Draw shapes using indices if they exist.  Otherwise, assume the vertices are arranged as triples.
        if (this.indices.length) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuInstance.index_buffer);
            gl.drawElements(gl[type], this.indices.length, gl.UNSIGNED_INT, 0);
        } else gl.drawArrays(gl[type], 0, Object.values(this.arrays)[0].length);
    }

    /**
     * To appear onscreen, a shape of any variety goes through this function,
     * which executes the shader programs.  The shaders draw the right shape due to
     * pre-selecting the correct buffer region in the GPU that holds that shape's data.
     * @param webglManager
     * @param programState
     * @param model_transform
     * @param material
     * @param type
     */
    draw(webglManager, programState, model_transform, material, type = "TRIANGLES") {
        const gpuInstance = this.activate(webglManager.context);
        material.shader.activate(webglManager.context, gpuInstance.webGL_buffer_pointers, programState, model_transform, material);
        // Run the shaders to draw every triangle now:
        this.executeShaders(webglManager.context, gpuInstance, type);
    }
}

/**
 * **GraphicsAddresses** is used internally in Shaders for organizing communication with the GPU.
 * Once we've compiled the Shader, we can query some things about the compiled program, such as
 * the memory addresses it will use for uniform variables, and the types and indices of its per-
 * vertex attributes.  We'll need those for building vertex buffers.
 */
class GraphicsAddresses {
    constructor(program, gl) {
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; ++i) {
            // Retrieve the GPU addresses of each uniform variable in the shader
            // based on their names, and store these pointers for later.
            let u = gl.getActiveUniform(program, i).name.split('[')[0];
            this[u] = gl.getUniformLocation(program, u);
        }

        this.shader_attributes = {};
        // Assume per-vertex attributes will each be a set of 1 to 4 floats:
        const typeToSizeMapping = {0x1406: 1, 0x8B50: 2, 0x8B51: 3, 0x8B52: 4};
        const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttribs; i++) {
            // https://github.com/greggman/twgl.js/blob/master/dist/twgl-full.js for another example:
            const attribInfo = gl.getActiveAttrib(program, i);
            // Pointers to all shader attribute variables:
            this.shader_attributes[attribInfo.name] = {
                index: gl.getAttribLocation(program, attribInfo.name),
                size: typeToSizeMapping[attribInfo.type],
                enabled: true, type: gl.FLOAT,
                normalized: false, stride: 0, pointer: 0,
            };
        }
    }
}


/**
 * **Container** allows a way to create patch JavaScript objects within a single line.  Some properties get
 * replaced with substitutes that you provide, without having to write out a new object from scratch.
 * To override, simply pass in "replacement", a JS Object of keys/values you want to override, to generate
 * a new object.  For shorthand you can leave off the key and only provide a value (pass in directly as
 * "replacement") and a guess will be used for which member you want overridden based on type.
 */
class Container {
    /**
     * Generate a copy by value, replacing certain properties.
     * @param replacement
     * @returns {(*)|*}
     */
    override(replacement) {
        return this.helper(replacement, Object.create(this.constructor.prototype));
    }

    /**
     * Like override, but modifies the original object.
     * @param replacement
     * @returns {(*)|*}
     */
    replace(replacement) {
        return this.helper(replacement, this);
    }

    /**
     * Internal helper function
     * @param replacement
     * @param target
     * @returns {any}
     */
    helper(replacement, target) {
        Object.assign(target, this);
        // If a JS object was given, use its entries to override:
        if (replacement.constructor === Object)
            return Object.assign(target, replacement);
        // Otherwise we'll try to guess the key to override by type:
        const matchingKeysByType = Object.entries(this).filter(([key, value
                                                                ]) => replacement instanceof value.constructor);
        if (!matchingKeysByType[0]) throw "Container: Can't figure out which value you're trying to replace; nothing matched by type.";
        return Object.assign(target, {[matchingKeysByType[0][0]]: replacement});
    }
}

/**
 * **ProgramState** stores any values that affect how your whole scene is drawn,
 * such as its current lights and the camera position.  Class Shader uses whatever
 * values are wrapped here as inputs to your custom shader program.  Your Shader
 * subclass must override its method "updateGPU()" to define how to send your
 * ProgramState's particular values over to your custom shader program.
 */
class ProgramState extends Container {
    constructor(cameraTransform = Mat4.identity(), projectionTransform = Mat4.identity()) {
        super();
        this.setCamera(cameraTransform);
        const defaults = {projectionTransform, animate: true, animationTime: 0, animationDeltaTime: 0};
        Object.assign(this, defaults);
    }

    /**
     * Applies a new (inverted) camera matrix to the ProgramState.
     * It's often useful to cache both the camera matrix and its inverse.  Both are needed
     * often and matrix inversion is too slow to recompute needlessly.
     * Note that setting a camera matrix traditionally means storing the inverted version,
     * so that's the one this function expects to receive; it automatically sets the other.
     * @param matrix
     */
    setCamera(matrix) {
        Object.assign(this, {cameraTransform: Mat4.inverse(matrix), camera_inverse: matrix});
    }
}

/**
 * **WebglManager** manages a whole graphics program for one on-page canvas, including its
 * textures, shapes, shaders, and scenes.  It requests a WebGL context and stores Scenes.
 */
class WebglManager {
    constructor(canvas, backgroundColor, dimensions) {
        const members = {
            instances: new Map(),
            scenes: [],
            prev_time: 0,
            canvas,
            scratchpad: {},
            programState: new ProgramState(),
        };
        Object.assign(this, members);
        // Get the GPU ready, creating a new WebGL context for this canvas:
        for (let name of ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"]) {
            this.context = this.canvas.getContext(name);
            if (this.context) break;
        }
        if (!this.context) throw "Canvas failed to make a WebGL context.";
        const gl = this.context;

        this.setSize(dimensions);

        gl.clearColor.apply(gl, backgroundColor);           // Tell the GPU which color to clear the canvas with each frame.
        gl.getExtension("OES_element_index_uint");           // Load an extension to allow shapes with more than 65535 vertices.
        gl.enable(gl.DEPTH_TEST);                            // Enable Z-Buffering test.
        // Specify an interpolation method for blending "transparent" triangles over the existing pixels:
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // Store a single red pixel, as a placeholder image to prevent a console warning:
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));

        // Find the correct browser's version of requestAnimationFrame() needed for queue-ing up re-display events:
        window.requestAnimFrame = (w =>
            w.requestAnimationFrame || w.webkitRequestAnimationFrame
            || w.mozRequestAnimationFrame || w.oRequestAnimationFrame || w.msRequestAnimationFrame
            || function (callback, element) {
                w.setTimeout(callback, 1000 / 60);
            })(window);
    }

    setSize(dimensions = [1080, 600]) {
        // setSize():  Allows you to re-size the canvas anytime.  To work, it must change the
        // size in CSS, wait for style to re-flow, and then change the size again within canvas
        // attributes.  Both are needed because the attributes on a canvas ave a special effect
        // on buffers, separate from their style.
        const [width, height] = dimensions;
        this.canvas.style["width"] = width + "px";
        this.canvas.style["height"] = height + "px";
        Object.assign(this, {width, height});
        Object.assign(this.canvas, {width, height});
        // Build the canvas's matrix for converting -1 to 1 ranged coords (NCDS) into its own pixel coords:
        this.context.viewport(0, 0, width, height);
    }

    render(time = 0) {
        // render(): Draw a single frame of animation, using all loaded Scene objects.  Measure
        // how much real time has transpired in order to animate shapes' movements accordingly.
        this.programState.animationDeltaTime = time - this.prev_time;
        if (this.programState.animate) this.programState.animationTime += this.programState.animationDeltaTime;
        this.prev_time = time;

        const gl = this.context;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Clear the canvas's pixels and z-buffer.

        const openList = [...this.scenes];
        while (openList.length) {
            // Traverse all Scenes and their children, recursively.
            openList.push(...openList[0].children);
            // Call display() to draw each registered animation:
            openList.shift().display(this, this.programState);
        }
        // Now that this frame is drawn, request that render() happen
        // again as soon as all other web page events are processed:
        this.event = window.requestAnimFrame(this.render.bind(this));
    }
}

export {GraphicsCardObject, VertexBuffer, GraphicsAddresses, Container, ProgramState, WebglManager};