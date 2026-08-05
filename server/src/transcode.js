import { execFile } from 'node:child_process';

export function webmToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', ['-y', '-i', inputPath, outputPath], (error) => {
      if (error) reject(error);
      else resolve(outputPath);
    });
  });
}
