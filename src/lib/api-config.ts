// Configuration for your self-hosted backend
// Change this URL when you deploy to AWS

export const API_CONFIG = {
  // Your AWS API Gateway / Load Balancer URL
  // Example: "https://api.yourdomain.com" or "https://xyz.execute-api.us-east-1.amazonaws.com/prod"
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8080",
  
  // API endpoints your Go backend should implement
  endpoints: {
    // PDF Operations
    mergePdf: "/api/pdf/merge",
    splitPdf: "/api/pdf/split",
    compressPdf: "/api/pdf/compress",
    rotatePdf: "/api/pdf/rotate",
    extractPages: "/api/pdf/extract",
    watermarkPdf: "/api/pdf/watermark",
    deletePages: "/api/pdf/delete-pages",
    reorderPages: "/api/pdf/reorder",
    
    // Office conversions
    excelToPdf: "/api/convert/excel-to-pdf",
    pdfToExcel: "/api/convert/pdf-to-excel",
    wordToPdf: "/api/convert/word-to-pdf",
    pdfToWord: "/api/convert/pdf-to-word",
    powerpointToPdf: "/api/convert/ppt-to-pdf",
    pdfToPowerpoint: "/api/convert/pdf-to-ppt",
    
    // Image conversions
    imageToPdf: "/api/convert/image-to-pdf",
    pdfToImage: "/api/convert/pdf-to-image",
    htmlToPdf: "/api/convert/html-to-pdf",
    
    // Advanced features
    ocrPdf: "/api/pdf/ocr",
    cropPdf: "/api/pdf/crop",
    signPdf: "/api/pdf/sign",
    repairPdf: "/api/pdf/repair",
    redactPdf: "/api/pdf/redact",
    unlockPdf: "/api/pdf/unlock",
    protectPdf: "/api/security/protect",
    addPageNumbers: "/api/pdf/add-page-numbers",
    addHeaderFooter: "/api/pdf/add-header-footer",
    pdfMetadata: "/api/pdf/metadata",
    pdfToText: "/api/convert/pdf-to-text",
    comparePdf: "/api/pdf/compare",
    batchProcess: "/api/pdf/batch",
    
    // Archive
    pdfToPdfa: "/api/convert/pdf-to-pdfa",
  },
};

// Helper to get full URL
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.endpoints): string => {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
};
