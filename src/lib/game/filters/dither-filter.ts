import { Filter, GlProgram } from "pixi.js";

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void)
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uPaletteLevels;
uniform float uDitherStrength;
uniform float uPixelSize;
uniform float uColorMix;

float bayer4(vec2 pixelCoord) {
  vec2 cell = mod(pixelCoord, 4.0);
  int x = int(cell.x);
  int y = int(cell.y);

  if (x == 0 && y == 0) return 0.0 / 16.0;
  if (x == 1 && y == 0) return 8.0 / 16.0;
  if (x == 2 && y == 0) return 2.0 / 16.0;
  if (x == 3 && y == 0) return 10.0 / 16.0;

  if (x == 0 && y == 1) return 12.0 / 16.0;
  if (x == 1 && y == 1) return 4.0 / 16.0;
  if (x == 2 && y == 1) return 14.0 / 16.0;
  if (x == 3 && y == 1) return 6.0 / 16.0;

  if (x == 0 && y == 2) return 3.0 / 16.0;
  if (x == 1 && y == 2) return 11.0 / 16.0;
  if (x == 2 && y == 2) return 1.0 / 16.0;
  if (x == 3 && y == 2) return 9.0 / 16.0;

  if (x == 0 && y == 3) return 15.0 / 16.0;
  if (x == 1 && y == 3) return 7.0 / 16.0;
  if (x == 2 && y == 3) return 13.0 / 16.0;
  return 5.0 / 16.0;
}

void main(void) {
  vec4 source = texture(uTexture, vTextureCoord);
  vec2 screenPixel = floor(vTextureCoord * uResolution / max(uPixelSize, 1.0));
  float threshold = bayer4(screenPixel) - 0.5;
  float levels = max(uPaletteLevels, 2.0);
  vec3 adjusted = source.rgb + threshold * (uDitherStrength / levels);
  vec3 quantized = floor(adjusted * (levels - 1.0) + 0.5) / (levels - 1.0);
  vec3 dithered = clamp(quantized, 0.0, 1.0);
  vec3 color = mix(source.rgb, dithered, uColorMix);

  finalColor = vec4(color, source.a);
}
`;

export class DitherFilter extends Filter {
  constructor() {
    super({
      glProgram: GlProgram.from({
        vertex,
        fragment,
      }),
      resources: {
        ditherUniforms: {
          uResolution: { value: [1920, 1080], type: "vec2<f32>" },
          uPaletteLevels: { value: 8, type: "f32" },
          uDitherStrength: { value: 0.48, type: "f32" },
          uPixelSize: { value: 2, type: "f32" },
          uColorMix: { value: 0.5, type: "f32" },
        },
      },
    });
  }

  setResolution(width: number, height: number) {
    this.resources.ditherUniforms.uniforms.uResolution = [width, height];
  }
}
