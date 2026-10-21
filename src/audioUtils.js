export function downsampleBuffer(input, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) return input.slice();
  const ratio = inputSampleRate / outputSampleRate;
  const output = new Float32Array(Math.round(input.length / ratio));
  let inputOffset = 0;
  for (let index = 0; index < output.length; index += 1) {
    const nextOffset = Math.min(input.length, Math.round((index + 1) * ratio));
    let sum = 0;
    for (let sample = inputOffset; sample < nextOffset; sample += 1) sum += input[sample];
    output[index] = nextOffset > inputOffset ? sum / (nextOffset - inputOffset) : 0;
    inputOffset = nextOffset;
  }
  return output;
}

export function floatTo16BitPCM(samples) {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return buffer;
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 0x8000) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  return btoa(chunks.join(""));
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export function pcm16ToFloat32(buffer) {
  const view = new DataView(buffer);
  const output = new Float32Array(Math.floor(buffer.byteLength / 2));
  for (let index = 0; index < output.length; index += 1) output[index] = view.getInt16(index * 2, true) / 32768;
  return output;
}
