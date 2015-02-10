/**
 * @author mrdoob / http://mrdoob.com/
 * but highly modified by ajbeach2@gmail.com
 */

THREE.OBJLoader = function(manager) {
    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
};

THREE.OBJLoader.prototype = {

    constructor: THREE.OBJLoader,
    load: function(url, onLoad, onProgress, onError) {
        var scope = this,
            loader = new THREE.XHRLoader(scope.manager);
        loader.setCrossOrigin(this.crossOrigin);
        loader.load(url, function(text) {
            onLoad(scope.parse(text));
        }, onProgress, onError);
    },

    parse: function(text) {

        console.time('OBJLoader');

        var vertices = [],
            normals = [],
            geometries = [],
            normalVectors = [],
            calculatedNormalVectors = [],
            faces = [],

        // v float float float
        vertex_pattern = /v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,
        // vn float float float
        normal_pattern = /vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/,
        // f vertex vertex vertex ...
        face_pattern1 = /f( +-?\d+)( +-?\d+)( +-?\d+)( +-?\d+)?/,
        // f vertex//normal vertex//normal vertex//normal ... 
        face_pattern4 = /f( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))?/;

        function getNormal(vert1, vert2, vert3) {
            var sub1 = new THREE.Vector3(),
                sub2 = new THREE.Vector3(),
                cross = new THREE.Vector3();

            sub1.subVectors(vert2, vert1);
            sub2.subVectors(vert3, vert1);

            cross.crossVectors(sub1, sub2);
            return cross;
        }

        // If the obj file doesn't have vertex normals
        // we can use the normals that we computed
        function setupNormals() {
            faces.forEach(function(face) {
                var ia = face[0],
                    ib = face[1],
                    ic = face[2];

                if (normalVectors.length == 0) {
                    calculatedNormalVectors[ia].normalize();
                    calculatedNormalVectors[ib].normalize();
                    calculatedNormalVectors[ic].normalize();
                    normals.push(
                        calculatedNormalVectors[ia].x, calculatedNormalVectors[ia].y, calculatedNormalVectors[ia].z,
                        calculatedNormalVectors[ib].x, calculatedNormalVectors[ib].y, calculatedNormalVectors[ib].z,
                        calculatedNormalVectors[ic].x, calculatedNormalVectors[ic].y, calculatedNormalVectors[ic].z);
                } else {
                    normals.push(
                        normalVectors[ia].x, normalVectors[ia].y, normalVectors[ia].z,
                        normalVectors[ib].x, normalVectors[ib].y, normalVectors[ib].z,
                        normalVectors[ic].x, normalVectors[ic].y, normalVectors[ic].z
                    );
                }
            })
        }

        // Adding the vectors together at each vertex, 
        // then normalizing will effectivly create an average of
        // all face normals that share that vertex
        function accumulateNormals(index, norm) {
            if (calculatedNormalVectors[index] == undefined) {
                calculatedNormalVectors[index] = norm;
            } else {
                calculatedNormalVectors[index].add(norm)
            }
        }

        function calculatFaceNormals(vect1, vect2, vect3, vertexIndicies) {
            var norm = getNormal(vect1, vect2, vect3);
            vertexIndicies.forEach(function(vertexIndex) {
                accumulateNormals(vertexIndex, norm);
            })
        }

        function addFace(a, b, c, d, na, nb, nc, nd) {
            //vertex index start with 1 in obj format
            var ia = parseFloat(a) - 1,
                ib = parseFloat(b) - 1,
                ic = parseFloat(c) - 1,
                vect1 = vertices[ia],
                vect2 = vertices[ib],
                vect3 = vertices[ic];

            geometries.push(
                vect1.x, vect1.y, vect1.z,
                vect2.x, vect2.y, vect2.z,
                vect3.x, vect3.y, vect3.z
            );

            // save face information, an index for each vertex
            faces.push(
                [ia, ib, ic]
            );

            calculatFaceNormals(vect1, vect2, vect3, [ia, ib, ic]);
        }

        function readFile() {
            var lines = text.split('\n');
            for (var i = 0; i < lines.length; i++) {

                var line = lines[i];
                line = line.trim();

                var result;

                if (line.length === 0 || line.charAt(0) === '#') {
                    continue;
                } else if ((result = vertex_pattern.exec(line)) !== null) {
                    // ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                    vertices.push((new THREE.Vector3(
                        parseFloat(result[1]),
                        parseFloat(result[2]),
                        parseFloat(result[3])
                    )));

                } else if ((result = normal_pattern.exec(line)) !== null) {
                    // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                    normalVectors.push((new THREE.Vector3(
                        parseFloat(result[1]),
                        parseFloat(result[2]),
                        parseFloat(result[3])
                    )));

                } else if ((result = face_pattern1.exec(line)) !== null) {
                    // ["f 1 2 3", "1", "2", "3", undefined]
                    addFace(
                        result[1], result[2], result[3], result[4]
                    );

                } else if ((result = face_pattern4.exec(line)) !== null) {
                    // ["f 1//1 2//2 3//3", " 1//1", "1", "1", " 2//2", "2", "2", " 3//3", "3", "3", undefined, undefined, undefined]
                    addFace(
                        result[2], result[5], result[8], result[11],
                        result[3], result[6], result[9], result[12]
                    );
                }
            }
        }

        function buildMesh() {
            var buffergeometry = new THREE.BufferGeometry();
            // add to vertix buffer
            buffergeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(geometries), 3));
            buffergeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));

            var material = new THREE.MeshLambertMaterial();
            var mesh = new THREE.Mesh(buffergeometry, material);

            return mesh;
        }

        readFile();
        setupNormals();

        console.timeEnd('OBJLoader');
        return buildMesh();
    }
};