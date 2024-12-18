/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader, extend } from "@react-three/fiber";
import { OrbitControls, Sky, Grid, useGLTF } from "@react-three/drei";
import { useTexture, Stats, Edges, Instance, Instances } from "@react-three/drei";
import { Sparkles, shaderMaterial, Line, Trail } from "@react-three/drei";
import { PerspectiveCamera, useMotion, MotionPathControls } from "@react-three/drei";
import { AudioProvider, useAudio } from "./AudioProvider";
import { RepeatWrapping, MirroredRepeatWrapping, AdditiveBlending, DoubleSide, BackSide } from "three";
import { Vector3, CatmullRomCurve3, DynamicDrawUsage} from "three"
import { TubeGeometry, Color, MathUtils, NearestFilter } from "three";
import { Bloom, Glitch, ChromaticAberration, EffectComposer } from "@react-three/postprocessing";
import { GlitchMode, BlendFunction } from "postprocessing";
import { GrannyKnot, VivianiCurve, CinquefoilKnot, KnotCurve } from "three/examples/jsm/curves/CurveExtras";
import { Tube, Points, PointMaterial, Environment } from "@react-three/drei";
import { Perf } from 'r3f-perf'
// import EqualizerGraph from './Equalizer'
import portalVertexShader from "./portal/vertex.glsl";
import portalFragmentShader from "./portal/fragment.glsl";

import wavyVertexShader from "./wavy/vertex.glsl";
import galaxyVertexShader from "./galaxy/vertex.glsl";
import wavyFragmentShader from "./wavy/fragment.glsl";
// const colors = ["#ffd319","#ff901f","#ff2975","#f222ff","#8c1eff"]

const colors = ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96"];

export default function App() {
  return (
    <Canvas>
      <AudioProvider>
      <Stats />
      {/* <Perf/> */}
        <ambientLight intensity={Math.PI / 2} />
        <directionalLight position={[2.5, 8, 5]} intensity={2} />

        <SceneCube />
        <MovingGrid/>
         {/* <WavyCube change={1}/> */}
         {/* <WavyCylinder change={1} /> */}
        {/* <AnimatedTube /> */}
        {/* <Shapes color={colors[1]}/> */}
        {/* <Shapes kind="tetra" color={colors[0]}/> */}
        {/* <Sparkles speed={2} scale={2} position-z={2} count={1000} /> */}
        {/* <Clouds count={100} /> */}
          {/* <Portal /> */}
         {/* <Track /> */}
        <StarCloud/>
         {/* <Galaxy change={1}/> */}
            {/* <MovingCamera /> */} 
         <OrbitControls /> 
        {/* <Environment background={true} backgroundBlurriness={0.9} backgroundIntensity={0.1} preset="night"/> */}
        <Efx/>
     </AudioProvider>
    </Canvas>
  );
}

function Efx() {
  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();

  return (
      <EffectComposer>
           {/* <ChromaticAberration */}
           {/*   blendFunction={BlendFunction.NORMAL} // blend mode */} 
           {/*   offset={[low/10000, 0.002]} // color offset */}
           {/* /> */} 

          <Bloom luminanceThreshold={0} mipmapBlur luminanceSmoothing={0.9} height={300} />
           <Glitch active mode={GlitchMode.SPORADIC} delay={[1.5, 3.5]}
           duration={[0.6, 1.0]} 
           strength={[0.3, 1.0]} 
           ratio={0.85} /> 
        </EffectComposer>
   
  )

}
function MovingGrid() {
  const ref1 = useRef();
  const ref2 = useRef();

  const speed = 2;
  useFrame((state, delta) => {
    ref1.current.position.z += speed * delta;
    ref2.current.position.z += speed * delta;
    if (ref1.current.position.z > 32) ref1.current.position.z = ref2.current.position.z - 32;
    if (ref2.current.position.z > 32) ref2.current.position.z = ref1.current.position.z - 32;
  });
  return (
    <>
      <Grid
        ref={ref1}
        args={[32, 32]}
        sectionColor={colors[3]}
        fadeDistance={50}
        fadeStrength={10}
        position-y={-5}
        position-z={16}
      />
      <Grid
        ref={ref2}
        args={[32, 32]}
        sectionColor={colors[3]}
        fadeDistance={50}
        fadeStrength={10}
        position-z={-16}
        position-y={-5}
      />
    </>
  );
}

function SceneCube() {
  const ref = useRef();
  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();

  useFrame((state, delta) => {
    ref.current.rotation.x += delta;
    ref.current.rotation.y += low * delta;
    ref.current.rotation.z += delta;
    const scale = 1 + amplitude*0.1;
    ref.current.scale.set(scale, scale, scale);
  });
  return (
    <>
      <mesh ref={ref}>
        <boxGeometry />
        <meshBasicMaterial color={colors[4]} wireframe />
        <Edges
          linewidth={4}
          scale={0.9}
          threshold={15} 
          color={colors[2]}
        />
      </mesh>
    </>
  );
}

const PortalMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorEnd: new Color("#ffffff"),
    uColorStart: new Color("#000000"),
  },
  portalVertexShader,
  portalFragmentShader
);

extend({ PortalMaterial });

function Portal() {
  const portalMaterial = useRef();
  const ref = useRef();
  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();
  if (portalMaterial.current) {
    portalMaterial.current.uColorStart = new Color("white");
    portalMaterial.current.uColorEnd = new Color(colors[3]);
  }
  useFrame((state, delta) => {
    portalMaterial.current.uTime += 2 * delta * amplitude * 0.2;
    ref.current.rotation.z += delta * 0.5 * mid;
  });
  return (
    <>
      <mesh position-z={0} ref={ref}>
        <sphereGeometry />
        <portalMaterial ref={portalMaterial} />
      </mesh>
    </>
  );
}

function Loop() {
  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();
  const motion = useMotion();
  useFrame((state, delta) => {
    motion.current += delta * 0.01 * amplitude
    // motion.current += delta * 0.01;
    motion.object.current.lookAt(motion.next);
  });
}
function Track() {
  const curve = new GrannyKnot();
  const geometry = useMemo(() => {
    return new TubeGeometry(curve, 2000, 0.1, 16, true); // Parameters: curve, tubularSegments, radius, radialSegments, closed
  }, [curve]);

  return (
    <>
      <mesh geometry={geometry} position-y={-1}>
        <meshStandardMaterial emissive={colors[4]} emissiveIntensity={2} toneMapped={false} wireframe={false} />
      </mesh>

      <MotionPathControls curves={[curve]}>
        <Loop />
      </MotionPathControls>
    </>
  );
}

function Clouds({ count }) {
  const texture = useTexture("/cloud10.png");

  const cloudsData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [
        MathUtils.randFloatSpread(10), 
        MathUtils.randFloat(-2, 5), 
        MathUtils.randFloat(-10, 10), 
      ],
      scale: Math.random() * Math.random() * 4, 
      rotation: Math.random() * Math.PI, 
    }));
  }, [count]);

  useFrame(() => {});
  return (
    <Instances limit={count}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} depthTest={false} opacity={0.5} />
      {cloudsData.map((data, i) => (
          <Instance
        key={i}
      position={data.position}
      scale={[data.scale, data.scale, 1]}
      rotation={[0, 0, data.rotation]}
      />
      ))}
    </Instances>
  );
}

const StarCloud = ({ numPoints = 5000 }) => {

  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();
  const texture1 = useTexture("/images/brightstar4.png");
  const texture2 = useTexture("/images/brightstar1.png");
  const texture3 = useTexture("/images/star10.png");
  const [points1, points2, points3] = useMemo(() => {
    const positions1 = new Float32Array(numPoints * 3); 
    const positions2 = new Float32Array(numPoints * 3); 
    const positions3 = new Float32Array(numPoints * 3); 
    for (let i = 0; i < numPoints; i++) {
      positions1[i * 3 + 0] = MathUtils.randFloat(-100, 100);
      positions1[i * 3 + 1] = MathUtils.randFloat(-100, 100);
      positions1[i * 3 + 2] = MathUtils.randFloat(-100, 100);
      positions2[i * 3 + 0] = MathUtils.randFloat(-100, 100);
      positions2[i * 3 + 1] = MathUtils.randFloat(-100, 100);
      positions2[i * 3 + 2] = MathUtils.randFloat(-100, 100);
      positions3[i * 3 + 0] = MathUtils.randFloat(-100, 100);
      positions3[i * 3 + 1] = MathUtils.randFloat(-100, 100);
      positions3[i * 3 + 2] = MathUtils.randFloat(-100, 100);
    }
    return [positions1, positions2, positions3];
  }, [numPoints]);

  return (
    <>
      <Stars points={points1} texture={texture1} />
      <Stars points={points2} texture={texture2} />
      <Stars points={points3} texture={texture3} />
    </>
  );
};

function Stars({ points, texture }) {
  return (
    <Points positions={points} stride={3} limit={5000}>
      <PointMaterial
        transparent
        size={0.5}
        sizeAttenuation
        map={texture} // Optionally add a texture here
        depthWrite={false}
        fog={false}
      />
    </Points>
  );
}

function Shapes({ count = 100, kind = "torus", color }) {
  const data = useMemo(() => {
    const randomVector = (r) => [r / 2 - Math.random() * r, r / 2 - Math.random() * r, r / 2 - Math.random() * r];
    const randomEuler = () => [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];

    const d = Array.from({ length: count }, (r = 100) => ({
      random: Math.random(),
      position: randomVector(r),
      rotation: randomEuler(),
      color,
    }));

    return d;
  }, [count,color]);

  return (
    <Instances range={count}>
      {kind == "torus" && <torusGeometry />}
      {kind == "tetra" && <tetrahedronGeometry />}
      <meshStandardMaterial metalness={0.5} roughness={0} color={color} />
      {data.map((props, i) => (
          <Shape key={i} {...props} />
      ))}
    </Instances>
  );
}

function Shape({ random, ...props }) {
  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime() + random * 10000;
    ref.current.rotation.set(Math.cos(t / 1), Math.sin(t / 4), Math.cos(t / 1.5));
    // ref.current.position.y = Math.sin(t * 1);
    ref.current.position.y = Math.sin(t + amplitude * 0.5);
  });
  return (
    <group {...props}>
      <Instance ref={ref} />
    </group>
  );
}

function CameraPath() {
  const {amplitude} = useAudio()
  const motion = useMotion();
  useFrame((state, delta) => {
    // motion.current += delta * 0.001 * amplitude
    motion.current += delta * 0.01 * amplitude;
    // motion.object.current.lookAt(motion.next);
  });
}

function MovingCamera() {

  const curve = new CinqueFoilKnot(1);
  return (
      <MotionPathControls curves={[curve]}>
    <CameraPath />
  </MotionPathControls>
  )
}


// Define a shader material for the nebula effect
const GalaxyMaterial = shaderMaterial(
  {
    uTime: 0,
    uSize: 30,
  },
  // Vertex Shader
  galaxyVertexShader,
  `
    varying vec3 vColor;

    void main()
    {
        // Disc
         float strength = distance(gl_PointCoord, vec2(0.5));
         strength = step(0.5, strength);
         strength = 1.0 - strength;

        // Diffuse point
         // strength *= 2.0;
         // strength = 1.0 - strength;

        // Light point
        // strength = 1.0 - strength;
        // strength = pow(strength, 4.0);

        // Final color
        vec3 color = mix(vec3(0.0), vColor, strength);
        gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ GalaxyMaterial });

function Galaxy({change}) {
  const materialRef = useRef();
  const insideColor = new Color(colors[4]);
  const outsideColor = new Color(colors[0]);
  // Animate the shader material
  useFrame((s, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime += delta;
    }
  });

  // Create a cloud of particles
  const [positions, vcolors, sizes]= useMemo(() => {
    const positions = [];
    const vcolors = [];
    const sizes = [];
    const branches = 5;
    const randomness = 2;
    const randomnessPower = 2;
    const spin = 1
    for (let i = 0; i < 10000; i++) {

      const branchAngle = (i % branches) / branches * Math.PI * 2
      const radius = MathUtils.randFloat(0, 7);
      const spinAngle = radius * spin 
      const randomX = MathUtils.randFloatSpread(0.5) 
      const randomZ = MathUtils.randFloatSpread(0.5) 
      const x = Math.cos(branchAngle + spinAngle + randomX) * radius;
      const z = Math.sin(branchAngle + spinAngle + randomZ) * radius;
      const y = MathUtils.randFloatSpread(2.0) * Math.exp(-radius * radius *0.05); // Flattened in the Y-axis
      // const y = 0


      positions.push(x, y, z);
      const mixedColor = insideColor.clone();
      mixedColor.lerp(outsideColor, radius / 5);
      vcolors.push(mixedColor.r, mixedColor.g, mixedColor.b);

      sizes.push(Math.random());
    }
    const x = change
    return [new Float32Array(positions), new Float32Array(vcolors), new Float32Array(sizes)];
  }, [change]);

  return (
    <Points positions={positions} colors={vcolors} stride={3} sizes={sizes}>
      <galaxyMaterial key={GalaxyMaterial.key} ref={materialRef} transparent blending={AdditiveBlending} vertexColors depthWrite={false} />
    </Points>
  );
}

const WavyMaterial = shaderMaterial(
  {
    time: 0,
    offsetSize: 2,
    size: 2,
    frequency: 2,
    amplitude: 0.8,
    offsetGain: 0.5,
    maxDistance: 1.8,
    startColor: new Color(colors[1]),
    endColor: new Color(colors[3]),
  },
  // Vertex Shader
  wavyVertexShader,
  wavyFragmentShader
);

extend({ WavyMaterial });

function WavyCube({change}) {
  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();
  const [widthSeg, heightSeg, depthSeg] = useMemo(() => {
    const x = change;
    return [
      Math.floor(MathUtils.randInt(5, 20)),
      Math.floor(MathUtils.randInt(1, 40)),
      Math.floor(MathUtils.randInt(5, 80)),
    ];
  }, [change]);

  const mref = useRef();
  const ref = useRef();

  useFrame(({ clock }, delta) => {
    if (mref.current) {
      mref.current.time += delta;
      // mref.current.amplitude = amplitude * 0.03;
      mref.current.frequency = amplitude * 0.03;
       // mref.current.offsetGain = low * 0.03;
       // mref.current.offsetSize = low * 0.03;
       //mref.current.size = low * 3;
    }

    if (ref.current) {
      // ref.current.rotation.x += delta
    }
  });

  return (
    <points ref={ref}>
      <boxGeometry attach="geometry" args={[1, 1, 1, widthSeg, heightSeg, depthSeg]} />
      <wavyMaterial ref={mref} transparent side={DoubleSide} />
    </points>
  );
}

function WavyCylinder({ change }) {
  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();
  const [radialSeg, heightSeg] = useMemo(() => {
    const x = change;
    return [Math.floor(MathUtils.randInt(64, 192)), Math.floor(MathUtils.randInt(64, 320))];
  }, [change]);
  const mref = useRef();
  const ref = useRef();

  useFrame((s, delta) => {
    if (mref.current) {
      mref.current.time += delta;
      mref.current.amplitude = amplitude * 0.03;
      mref.current.frequency = amplitude * 0.03;
       // mref.current.offsetGain = amplitude * 0.03;
       // mref.current.offsetSize = amplitude * 3;
    }

    if (ref.current) {
      ref.current.rotation.y += mid*delta
    }
  });

  return (
    <points ref={ref} rotation-x={Math.PI / 2}>
      <cylinderGeometry attach="geometry" args={[1, 1, 4, radialSeg, heightSeg, true]} />
      <wavyMaterial ref={mref} transparent side={DoubleSide} />
    </points>
  );
}

const AnimatedTube = () => {
  const tubeRef = useRef();

  const { low, lowmid, mid, highmid, high, amplitude } = useAudio();
  const points = [
    new Vector3(0, 0, 10),
    new Vector3(0, 0, 0),

    new Vector3(0, -0.2, -10),
    new Vector3(0, -0.3, -20),
    new Vector3(0, -1.0, -30),
    new Vector3(0, 0, -40),
  ];

//   const tubeTexture = useTexture("/images/colorfull.jpg");
  const tubeTexture = useTexture("/images/water.jpg");
  const tubeOpacity = 0.4;
  const globalRotation = 0.001;
  const tubeMoveForward = 0.0026;
  const tubeTextureRotation = 0.0006;

  useMemo(() => {
    tubeTexture.wrapS = MirroredRepeatWrapping;
    tubeTexture.wrapT = MirroredRepeatWrapping;
    tubeTexture.repeat.set(1, 2);
  }, [tubeTexture]);


  const curve = new CatmullRomCurve3(points);
  const geometry = new TubeGeometry(curve, 64,1,32, false)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (tubeRef.current) {
      tubeRef.current.rotation.z += globalRotation * low;
      tubeTexture.offset.y -= tubeMoveForward ;
      tubeTexture.offset.x += tubeTextureRotation;
    }
 
    // curve.points[0].y = Math.sin(time/4) * 0.5;
    // curve.points[0].x = Math.sin(time/3) * 0.5;

    // tubeRef.current.geometry.dispose()
    // tubeRef.current.geometry = new TubeGeometry(curve, 64, 1, 32, false);
  });

  return (
    <Tube ref={tubeRef}>
      <tubeGeometry args={[curve, 64,1,32,false]}/>
      <meshStandardMaterial side={BackSide} 
        map={tubeTexture} 
        blending={AdditiveBlending}
        transparent
        opacity={tubeOpacity}
      />
    </Tube>
  );
};
