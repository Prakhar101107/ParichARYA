/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QualityCheckResult {
  passed: boolean;
  isDark: boolean;
  isBlurry: boolean;
  isOverexposed: boolean;
  brightnessScore: number;
  edgeContrastScore: number;
  warningMessage?: string;
  hindiWarningMessage?: string;
}

/**
 * Checks an image file or data URL for extreme darkness or blur using downsampled canvas analysis.
 */
export async function analyzeImageQuality(imageSource: string): Promise<QualityCheckResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const sampleSize = 100;
        const canvas = document.createElement('canvas');
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            passed: true,
            isDark: false,
            isBlurry: false,
            isOverexposed: false,
            brightnessScore: 128,
            edgeContrastScore: 25,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imgData.data;

        let totalLuminance = 0;
        const grayMatrix: number[][] = Array.from({ length: sampleSize }, () =>
          new Array(sampleSize).fill(0),
        );

        for (let y = 0; y < sampleSize; y++) {
          for (let x = 0; x < sampleSize; x++) {
            const idx = (y * sampleSize + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            grayMatrix[y][x] = lum;
            totalLuminance += lum;
          }
        }

        const avgBrightness = totalLuminance / (sampleSize * sampleSize);

        // Compute edge contrast via simple Sobel-like gradient approximation
        let gradientSum = 0;
        let count = 0;
        for (let y = 1; y < sampleSize - 1; y++) {
          for (let x = 1; x < sampleSize - 1; x++) {
            const dx = Math.abs(grayMatrix[y][x + 1] - grayMatrix[y][x - 1]);
            const dy = Math.abs(grayMatrix[y + 1][x] - grayMatrix[y - 1][x]);
            gradientSum += dx + dy;
            count++;
          }
        }

        const edgeContrast = count > 0 ? gradientSum / count : 30;

        const isDark = avgBrightness < 45;
        const isOverexposed = avgBrightness > 242;
        const isBlurry = edgeContrast < 11;

        let warningMessage: string | undefined;
        let hindiWarningMessage: string | undefined;

        if (isDark) {
          warningMessage = 'The prescription photo appears quite dark or shadowy. Handwritten text may be hard to read.';
          hindiWarningMessage = 'फोटो में रोशनी कम (अंधेरा) लग रही है। लिखावट पढ़ने में कठिनाई हो सकती है।';
        } else if (isOverexposed) {
          warningMessage = 'The photo has severe flash glare or is washed out. Some text might be missing.';
          hindiWarningMessage = 'फोटो पर बहुत तेज चमक या फ्लैश है। कुछ अक्षर कट सकते हैं।';
        } else if (isBlurry) {
          warningMessage = 'The prescription looks blurred or out of focus. Please hold the phone steady.';
          hindiWarningMessage = 'फोटो धुंधली दिख रही है। कृपया फोन को स्थिर रखकर दोबारा लें।';
        }

        const passed = !isDark && !isOverexposed && !isBlurry;

        resolve({
          passed,
          isDark,
          isBlurry,
          isOverexposed,
          brightnessScore: Math.round(avgBrightness),
          edgeContrastScore: Math.round(edgeContrast),
          warningMessage,
          hindiWarningMessage,
        });
      } catch (err) {
        console.warn('Image quality analysis failed, skipping check:', err);
        resolve({
          passed: true,
          isDark: false,
          isBlurry: false,
          isOverexposed: false,
          brightnessScore: 128,
          edgeContrastScore: 25,
        });
      }
    };

    img.onerror = () => {
      resolve({
        passed: true,
        isDark: false,
        isBlurry: false,
        isOverexposed: false,
        brightnessScore: 128,
        edgeContrastScore: 25,
      });
    };

    img.src = imageSource;
  });
}
