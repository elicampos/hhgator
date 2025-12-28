import * as pdfjsModule from 'pdfjs-dist';

// Handle potential ESM/CJS interop issues with esm.sh
// The library is often hanging off the default export in bundled environments
const pdfjs = (pdfjsModule as any).default || pdfjsModule;

// Set worker source to CDNJS which is often more reliable for importScripts/CORS
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// Local definition of ImageKind if missing (it's often an enum in TS but just an object or constants in JS)
const ImageKind = pdfjs.ImageKind || {
  GRAYSCALE_1BPP: 1,
  RGB: 2,
  RGBA: 3
};

export const extractImagesFromPdf = async (file: File): Promise<string[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // usage of pdfjs.getDocument
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const images: string[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const ops = await page.getOperatorList();
      
      const imageNames = ops.fnArray.reduce((acc: string[], fn: number, index: number) => {
        // usage of pdfjs.OPS
        if (fn === pdfjs.OPS.paintImageXObject) {
          const arg = ops.argsArray[index][0];
          acc.push(arg);
        }
        return acc;
      }, []);

      for (const imgName of imageNames) {
        try {
          // Access internal objs to get image data (technically internal API)
          const img = await (page as any).objs.get(imgName);
          
          if (img && img.data) {
            // FILTER: Ignore small images (icons, bullets, lines)
            // A diagram is usually at least 50x50 pixels
            if (img.width < 50 || img.height < 50) {
              continue;
            }

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              const imageData = ctx.createImageData(img.width, img.height);
              
              if (img.kind === ImageKind.GRAYSCALE_1BPP) {
                  const data = img.data;
                  const rgbaData = imageData.data;
                  let dest = 0;
                  for (let i = 0; i < data.length; i++) {
                     const byte = data[i];
                     for (let bit = 7; bit >= 0; bit--) {
                        const val = (byte >> bit) & 1 ? 0 : 255; 
                        if (dest < rgbaData.length) {
                            rgbaData[dest++] = val;
                            rgbaData[dest++] = val;
                            rgbaData[dest++] = val;
                            rgbaData[dest++] = 255;
                        }
                     }
                  }
              } else if (img.kind === ImageKind.RGB) {
                const data = img.data;
                const rgbaData = imageData.data;
                let src = 0;
                let dest = 0;
                while (src < data.length && dest < rgbaData.length) {
                  rgbaData[dest++] = data[src++];
                  rgbaData[dest++] = data[src++];
                  rgbaData[dest++] = data[src++];
                  rgbaData[dest++] = 255; 
                }
              } else if (img.kind === ImageKind.RGBA) {
                 imageData.data.set(img.data);
              } else {
                 continue;
              }

              ctx.putImageData(imageData, 0, 0);
              images.push(canvas.toDataURL('image/png'));
            }
          }
        } catch (e) {
          console.warn(`Failed to extract image ${imgName} on page ${pageNum}`, e);
        }
      }
      
      page.cleanup();
    }
    
    return images;
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    return [];
  }
};