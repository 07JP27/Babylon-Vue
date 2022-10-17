import { Engine, Scene, ArcRotateCamera, Vector3, MeshBuilder, StandardMaterial, Color3,Color4, HemisphericLight, Nullable, Mesh, Effect, ShaderMaterial, VertexData, VertexBuffer, BaseTexture, MirrorTexture, Plane, SceneLoader} from "@babylonjs/core";
import '@babylonjs/loaders'
const createScene = (canvas: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext | WebGL2RenderingContext>) => {
  const engine = new Engine(canvas);
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0);

  const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 30, new Vector3(0, 0, 0));
  camera.attachControl(canvas, true);
  camera.useAutoRotationBehavior = true;
  camera.upperBetaLimit = Math.PI / 2  - 0.1;
  camera.lowerRadiusLimit = 5;

  var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
  light.intensity = 0.1;

 
 const importPromise = SceneLoader.ImportMeshAsync(["Body1"], "", "switch.obj", scene);
importPromise.then((result) => {
    var target = result.meshes[0]
  barycentric(target);
  target.material = shaderMaterial
  target.rotation.x = -1.55
  target.position.x = -6
  target.position.y = -0
  target.position.z = 6
  texture.renderList =  [target];


  //// Result has meshes, particleSystems, skeletons, animationGroups and transformNodes
})


/*
  var box = Mesh.CreateBox("box", 2, scene);
  barycentric(box);
  var box2 = Mesh.CreateBox("box2", 1, scene);
  barycentric(box2);
  box2.position.x = 1.5
  box.position.y = 1.01;
  box2.position.y = 0.51;
  */

  var ground = Mesh.CreateGround("ground1", 6, 6, 2, scene);

  //barycentric(ground);

  Effect.ShadersStore['wireframeVertexShader'] = `
        precision highp float;

        attribute vec3 position, normal;
        uniform mat4 worldViewProjection;
        varying vec3 vBC;
        varying float fFogDistance;

        void main(){
            vBC = normal;

            vec4 p = vec4(position, 1.);
            gl_Position = worldViewProjection * p;
        }
    `;

    Effect.ShadersStore['wireframeFragmentShader'] = `
        #extension GL_OES_standard_derivatives : enable
        precision highp float;

        varying vec3 vBC;
        varying float fFogDistance;
        
        uniform float fwidthFactor;
        uniform float fSmooth;
        

        float edgeFactor(){
            vec3 barys;
            barys = vBC;
            vec3 deltas = fwidth(barys);
            vec3 smoothing = deltas * (fwidthFactor+fSmooth);
            vec3 thickness = deltas * fwidthFactor;
            barys = smoothstep(thickness, thickness + smoothing, barys);
            float minBary = min(barys.z, barys.y);       
            return minBary;
        }

        void main(){
            vec3 cellC = vec3(0.0, 0.5, 0.7);
            float cellA = 0.2;
            vec3 wireC = vec3(0.6, 0.6, 1.0);

            float wireA = 1.0-edgeFactor();              

            vec4 color = vec4(mix(cellC, wireC, wireA), min(max(wireA, cellA), 1.0));

            // vec4(mix(vec3(0.0), vec3(0.5), edgeFactor()), 1.0);

            gl_FragColor = color;
        }
    `;

    var shaderMaterial = new ShaderMaterial("shader", scene, {
            vertexElement: "wireframe",
            fragmentElement: "wireframe",
        }, {
            needAlphaBlending : true,
            attributes: ["position", "normal"],
            uniforms: ["worldViewProjection", "fwidthFactor", "fSmooth"]
        })

    var fwidthFactor = 0.3
    var fSmooth = 1.3

    shaderMaterial.setFloat('fwidthFactor', fwidthFactor)
    shaderMaterial.setFloat('fSmooth', fSmooth)

    shaderMaterial.backFaceCulling = false
/*
    box.material = shaderMaterial
    box2.material = shaderMaterial
    */
    //ground.material = shaderMaterial


    var mirror = Mesh.CreateBox("Mirror", 1.0, scene);
    var groundMaterial = new StandardMaterial("mirror", scene);

    groundMaterial.diffuseColor = new Color3(0, 0, 0);
    var texture = new MirrorTexture("mirror", 1024, scene, true);
    texture.mirrorPlane =  new Plane(0, -1, 0, 0);
    //texture.renderList =  [box, box2];
    texture.level = 0.2;
    groundMaterial.reflectionTexture = texture

    mirror.scaling = new Vector3(50.0, 0.01, 50.0);
    mirror.material = groundMaterial        	

  engine.runRenderLoop(() => {
    scene.render();
  });
};

function barycentric(target: any) {
    var vd = new VertexData();
    var pos = [], ind = [], nor = [];
    let positions = target.getVertexBuffer(VertexBuffer.PositionKind).getData()
    let indices =  target.getIndices()
    for (var i = 0; i < indices.length; i += 3) {
        var i1 = 3 * indices[i];
        var i2 = 3 * indices[i + 1];
        var i3 = 3 * indices[i + 2];

        let a = new Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2]);
        let b = new Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2]);
        let c = new Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);

        pos.push(positions[i1], positions[i1 + 1], positions[i1 + 2]);
        pos.push(positions[i2], positions[i2 + 1], positions[i2 + 2]);
        pos.push(positions[i3], positions[i3 + 1], positions[i3 + 2]);
               
        ind.push(i, i + 1, i + 2);

        let id = 0
        let d = Vector3.Distance(a,b)
        let e = Vector3.Distance(b,c)       
        if(e>d){
            id = 1
            d = e
        }
        e = Vector3.Distance(c,a)        
        if(e>d){
            id = 2
        }
        if(id==1){
            nor.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
        }else if(id==2){
            nor.push(0, 1, 0, 1, 0, 0, 0, 0, 1);
        }else{
            nor.push(0, 1, 0, 0, 0, 1, 1, 0, 0);
        }

    }
    vd.positions = pos
    vd.indices = ind
    vd.normals = nor
    vd.applyToMesh(target)
}

export { createScene };