// set the scene size
// ?%script{:src => "https://cdnjs.cloudflare.com/ajax/libs/three.js/r68/three.js"}
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight,
        VIEW_ANGLE = 45,
        scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, WIDTH / HEIGHT, 0.1, 2000),
        renderer = new THREE.WebGLRenderer();

    var directionalLight = new THREE.DirectionalLight(0x99FF33, .75);
    

    var light = new THREE.PointLight( 0x99FF33, 1, 50 );
    light.position.set( -3, 0, 0 );



    directionalLight.position.set(1, 1, 2);
    scene.add(light);
    scene.add(directionalLight);

    renderer.setSize(WIDTH, HEIGHT);

    var callback = function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', callback, false);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 3;
    camera.position.y = 1;

    var manager = new THREE.LoadingManager();

    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };

    var onError = function(xhr) {};
    var loader = new THREE.OBJLoader(manager);

    var g;
    var render = function() {
        requestAnimationFrame(render);
        g.position.set(.25,0,0);
         g.rotation.y += .01;

        renderer.render(scene, camera);
    };

    loader.load('bunny.obj', function(object) {
        object.scale.set(10, 10, 10);
        

        g = object;
        scene.add(object);
        render();

    }, onProgress, onError);
