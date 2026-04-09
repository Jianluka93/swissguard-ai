
import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function test() {
  try {
    const mod = require("pdf-parse");
    console.log("Keys:", Object.keys(mod));
    
    const Parser = mod.PDFParse || mod;
    console.log("Parser type:", typeof Parser);
    
    if (Parser.prototype && typeof Parser.prototype.getText === "function") {
      console.log("Using class-based API");
      const instance = new Parser({ data: Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 712 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000062 00000 n \n0000000117 00000 n \n0000000223 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF") });
      const result = await instance.getText();
      console.log("Result text:", result.text);
    } else {
      console.log("Using function-based API");
      const data = await Parser(Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 712 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000062 00000 n \n0000000117 00000 n \n0000000223 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF"));
      console.log("Result text:", data.text);
    }
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
