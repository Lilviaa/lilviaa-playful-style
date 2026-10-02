export const generateDashboardCanvas = async (elementId: string): Promise<HTMLCanvasElement> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Element not found");

  const width = element.offsetWidth * 2; // 2x scaled
  const height = element.offsetHeight * 2;

  // Clone the node to apply export-specific modifications
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remove interactive elements
  const ignores = clone.querySelectorAll('[data-html2canvas-ignore="true"]');
  ignores.forEach(el => el.remove());

  // Inline styles for the clone to ensure they render in foreignObject
  // This is a simplified serialization approach
  const styles = document.styleSheets;
  let cssText = "";
  for (let i = 0; i < styles.length; i++) {
    try {
      const rules = styles[i].cssRules;
      for (let j = 0; j < rules.length; j++) {
        cssText += rules[j].cssText;
      }
    } catch (e) {
      // CORS stylesheet issues
    }
  }

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${element.offsetWidth}" height="${element.offsetHeight}">
      <style>${cssText}</style>
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif; width: ${element.offsetWidth}px; height: ${element.offsetHeight}px;">
          ${clone.innerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // 1-second timeout guard
    const timeout = setTimeout(() => {
      reject(new Error("SVG serialization timed out"));
      URL.revokeObjectURL(url);
    }, 1000);

    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // 2x scaling
        ctx.scale(2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, element.offsetWidth, element.offsetHeight);
        ctx.drawImage(img, 0, 0);
      }
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = (e) => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
};

export const exportToPNG = async (elementId: string, filename: string = "dashboard.png") => {
  try {
    const canvas = await generateDashboardCanvas(elementId);
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Export to PNG failed:", error);
  }
};

export const exportToPDF = async (elementId: string) => {
  try {
    const canvas = await generateDashboardCanvas(elementId);
    const imgData = canvas.toDataURL("image/png");
    
    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Dashboard Export</title>
            <style>
              @page { size: landscape; margin: 0; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  } catch (error) {
    console.error("Export to PDF failed:", error);
  }
};
