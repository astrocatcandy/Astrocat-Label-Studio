import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Batch } from '../../types/models';

/** Portrait prints the original 70 x 100 mm label. Landscape rotates the *same* label 90° clockwise. */
export type LabelOrientation = 'portrait' | 'landscape';

async function captureLabel(): Promise<HTMLCanvasElement> {
  const source = document.getElementById('label-print-surface') as HTMLElement | null;
  if (!source) throw new Error('Keine Etikettenvorschau gefunden.');
  await document.fonts.ready;
  const stage = document.createElement('div');
  stage.style.cssText = 'position:fixed;left:-12000px;top:0;width:70mm;height:100mm;pointer-events:none;z-index:-1';
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.zoom = '1';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  stage.appendChild(clone);
  document.body.appendChild(stage);
  try {
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(images.map(img => img.decode().catch(() => {
      throw new Error('Logo konnte nicht geladen werden. Bitte als PNG/JPG erneut hochladen.');
    })));
    const excess = clone.scrollHeight - clone.clientHeight;
    if (excess > 2) throw new Error(`Etikett ist um etwa ${(excess * 25.4 / 96).toFixed(1)} mm zu hoch. Pflichtangaben dürfen nicht abgeschnitten werden.`);
    return await html2canvas(clone, {
      backgroundColor: '#ffffff', scale: 4, useCORS: true, allowTaint: false,
      logging: false, imageTimeout: 10000,
      width: clone.clientWidth, height: clone.clientHeight,
      scrollX: 0, scrollY: 0,
    });
  } finally {
    stage.remove();
  }
}

function rotatedCanvas(canvas: HTMLCanvasElement, orientation: LabelOrientation): HTMLCanvasElement {
  if (orientation === 'portrait') return canvas;
  const rotated = document.createElement('canvas');
  rotated.width = canvas.height;
  rotated.height = canvas.width;
  const context = rotated.getContext('2d');
  if (!context) throw new Error('Canvas-Kontext ist nicht verfügbar.');
  context.translate(rotated.width, 0);
  context.rotate(Math.PI / 2);
  context.drawImage(canvas, 0, 0);
  return rotated;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportPreviewPNG(batch: Batch, orientation: LabelOrientation = 'portrait'): Promise<void> {
  const canvas = rotatedCanvas(await captureLabel(), orientation);
  downloadDataUrl(canvas.toDataURL('image/png'), `astrocat-${batch.number}-${orientation === 'portrait' ? '70x100' : '100x70'}-${orientation}.png`);
}

export async function exportPreviewPDF(batch: Batch, orientation: LabelOrientation = 'portrait'): Promise<void> {
  const canvas = rotatedCanvas(await captureLabel(), orientation);
  const png = canvas.toDataURL('image/png');
  const landscape = orientation === 'landscape';
  const width = landscape ? 100 : 70;
  const height = landscape ? 70 : 100;
  // Exactly one label per PDF. The printer application sets the required number of copies.
  const pdf = new jsPDF({ orientation, unit: 'mm', format: [width, height], compress: true });
  pdf.addImage(png, 'PNG', 0, 0, width, height, undefined, 'FAST');
  pdf.save(`astrocat-${batch.number}-${width}x${height}-${orientation}.pdf`);
}
