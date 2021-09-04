# TinyGraphics.js

This is a small, single file JavaScript utility. It organizes WebGL programs to be object-oriented and minimally
cluttered.

Writing code with raw JavaScript and WebGL can be repetitive and tedious. Using frameworks like three.js can create an
undesired separation between you and the raw JavaScript and WebGL and common graphics operations you want to learn.
Unlike other frameworks, TinyGraphics.js is purpose-built for education, has small source code, and teaches you how it
is made.

This tiny library gives your WebGL program access to linear algebra routines, useful UI controls and readouts, and the
drawing utilities needed by modern shader-based graphics. It factors away the repetitive logic of GPU communication into
re-usable objects. The objects can be seamlessly shared between multiple WebGL contexts (drawing regions) on a web page.

The TinyGraphics.js software library has accompanied UCLA Computer Science's 174a course (Intro to Computer Graphics)
since 2016, replacing Edward Angel's supplemental code from his textbook "Interactive Computer Graphics: A Top-Down
Approach with WebGL". Compared to Angel's library, TinyGraphics.js offers more organization and functionality.

This code library accompanies and supports a web project by the same author called "The Encyclopedia of Code", a
crowd-sourced repository of WebGL demos and educational tutorials that uses an online editor.

To run a sample using TinyGraphics.js, visit its GitHub Pages
link: https://encyclopedia-of-code.github.io/tiny-graphics-js/

To see all the demos and edit them:  Open the included "host.bat" or "host.command" file, then open localhost in your
browser. Open Developer Tools and create a workspace for your new folder. Now you can edit the files, which is necessary
to view the different demos.

To select a demo, open and edit mainScenes.js. Assign your choice to the MainScene variable. Your choices for scenes
are:

* MinimalWebglDemo
* TransformsSandbox
* AxesViewerTestScene
* InertiaDemo
* CollisionDemo
* ManyLightsDemo
* ObjFileDemo
* TextDemo
* SceneToTextureDemo
* SurfacesDemo

The code comments in each file should help, especially if you look at the definition of Transforms_Sandbox. So should
the explanations that the demos print on the page. Enjoy!
