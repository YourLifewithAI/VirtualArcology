/**
 * Floor striping without geometry: darken a thin band wherever world-height
 * crosses a floor boundary, fading out beyond ~3 km so the massing stays clean
 * at distance. Injected via onBeforeCompile into the massing material.
 */
import type * as THREE from 'three';

export function injectFloorBands(material: THREE.Material, floorHeight: () => number): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFloorHeight = { get value() { return floorHeight(); } };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vArcWorldY;',
      )
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\n{ vec4 awp = modelMatrix * vec4(transformed, 1.0); vArcWorldY = awp.y; }',
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vArcWorldY;\nuniform float uFloorHeight;',
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          float fh = max(uFloorHeight, 0.5);
          float f = fract(vArcWorldY / fh);
          float band = 1.0 - smoothstep(0.0, 0.09, min(f, 1.0 - f));
          float dist = length(vViewPosition);
          float fade = 1.0 - smoothstep(1200.0, 3200.0, dist);
          diffuseColor.rgb *= 1.0 - 0.13 * band * fade;
        }`,
      );
  };
}
