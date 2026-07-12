import * as THREE from 'three';
import {
  WORLD_SIZE,
  WORLD_SIZE_X,
  WORLD_SIZE_Y,
  WORLD_SIZE_Z,
  AIR,
  WATER,
  GLASS,
  LEAVES,
  BLOCK_LIST,
  getBlockColor,
  isTransparent
} from './blocks.js';

const FACES = [
  {
    name: 'top',
    dir: [0, 1, 0],
    vertices: [
      [0, 1, 0],
      [1, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 1]
    ],
    normal: [0, 1, 0]
  },
  {
    name: 'bottom',
    dir: [0, -1, 0],
    vertices: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 0, 0],
      [0, 0, 1],
      [1, 0, 0],
      [0, 0, 0]
    ],
    normal: [0, -1, 0]
  },
  {
    name: 'right',
    dir: [1, 0, 0],
    vertices: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1],
      [1, 0, 1]
    ],
    normal: [1, 0, 0]
  },
  {
    name: 'left',
    dir: [-1, 0, 0],
    vertices: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 1],
      [0, 1, 0],
      [0, 0, 0]
    ],
    normal: [-1, 0, 0]
  },
  {
    name: 'front',
    dir: [0, 0, 1],
    vertices: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
      [0, 1, 1]
    ],
    normal: [0, 0, 1]
  },
  {
    name: 'back',
    dir: [0, 0, -1],
    vertices: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0]
    ],
    normal: [0, 0, -1]
  }
];

export class GameRenderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.world = world;
    this.meshes = new Map();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(
      WORLD_SIZE_X / 2,
      40,
      WORLD_SIZE_Z / 2
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
    this.directionalLight = directionalLight;

    const highlightGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const highlightEdges = new THREE.EdgesGeometry(highlightGeo);
    const highlightMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    this.highlightMesh = new THREE.LineSegments(highlightEdges, highlightMat);
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);

    this.rebuildMeshes();

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  rebuildMeshes() {
    for (const [blockId, mesh] of this.meshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.meshes.clear();

    const geometries = {};
    for (const block of BLOCK_LIST) {
      geometries[block.id] = {
        positions: [],
        colors: [],
        normals: []
      };
    }

    const colorCache = {};
    function getColor(blockId, face) {
      const key = `${blockId}_${face}`;
      if (!colorCache[key]) {
        colorCache[key] = new THREE.Color(getBlockColor(blockId, face));
      }
      return colorCache[key];
    }

    for (let x = 0; x < WORLD_SIZE_X; x++) {
      for (let y = 0; y < WORLD_SIZE_Y; y++) {
        for (let z = 0; z < WORLD_SIZE_Z; z++) {
          const blockId = this.world.getBlock(x, y, z);
          if (blockId === AIR) continue;

          for (const face of FACES) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            let neighborId;
            if (!this.world.inBounds(nx, ny, nz)) {
              neighborId = AIR;
            } else {
              neighborId = this.world.getBlock(nx, ny, nz);
            }

            let shouldRenderFace = false;

            if (neighborId === AIR) {
              shouldRenderFace = true;
            } else if (blockId === WATER) {
              shouldRenderFace = neighborId !== WATER;
            } else if (isTransparent(blockId)) {
              shouldRenderFace = neighborId !== blockId;
            } else {
              shouldRenderFace = isTransparent(neighborId);
            }

            if (!shouldRenderFace) continue;

            const color = getColor(blockId, face.name);
            const geo = geometries[blockId];

            for (let i = 0; i < 6; i++) {
              const v = face.vertices[i];
              geo.positions.push(x + v[0], y + v[1], z + v[2]);
              geo.colors.push(color.r, color.g, color.b);
              geo.normals.push(face.normal[0], face.normal[1], face.normal[2]);
            }
          }
        }
      }
    }

    for (const block of BLOCK_LIST) {
      const blockId = block.id;
      const geo = geometries[blockId];
      if (geo.positions.length === 0) continue;

      const bufferGeo = new THREE.BufferGeometry();
      bufferGeo.setAttribute('position', new THREE.Float32BufferAttribute(geo.positions, 3));
      bufferGeo.setAttribute('color', new THREE.Float32BufferAttribute(geo.colors, 3));
      bufferGeo.setAttribute('normal', new THREE.Float32BufferAttribute(geo.normals, 3));

      let material;
      if (blockId === WATER) {
        material = new THREE.MeshLambertMaterial({
          transparent: true,
          opacity: 0.6,
          vertexColors: true,
          side: THREE.DoubleSide
        });
      } else if (blockId === GLASS) {
        material = new THREE.MeshLambertMaterial({
          transparent: true,
          opacity: 0.7,
          vertexColors: true
        });
      } else if (blockId === LEAVES) {
        material = new THREE.MeshLambertMaterial({
          transparent: true,
          opacity: 0.8,
          vertexColors: true
        });
      } else {
        material = new THREE.MeshLambertMaterial({
          vertexColors: true
        });
      }

      const mesh = new THREE.Mesh(bufferGeo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.meshes.set(blockId, mesh);
    }
  }

  updateBlockHighlight(x, y, z, face) {
    if (x === null || y === null || z === null) {
      this.highlightMesh.visible = false;
      return;
    }
    this.highlightMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.highlightMesh.visible = true;
  }

  render(cameraPos, cameraRot) {
    if (cameraPos) {
      this.camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
    }
    if (cameraRot) {
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = cameraRot.yaw || 0;
      this.camera.rotation.x = cameraRot.pitch || 0;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);

    for (const [blockId, mesh] of this.meshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.meshes.clear();

    this.scene.remove(this.highlightMesh);
    this.highlightMesh.geometry.dispose();
    this.highlightMesh.material.dispose();

    this.renderer.dispose();
  }
}
