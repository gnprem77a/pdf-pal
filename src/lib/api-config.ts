// Configuration for your self-hosted backend
// Change this URL when you deploy to AWS

export const API_CONFIG = {
  // Your AWS API Gateway / Load Balancer URL
  // Example: "https://api.yourdomain.com" or "https://xyz.execute-api.us-east-1.amazonaws.com/prod"
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8080",
  
  // API endpoints your Go backend should implement
  endpoints: {
    // Office conversions
    excelToPdf: "/api/convert/excel-to-pdf",
    pdfToExcel: "/api/convert/pdf-to-excel",
    powerpointToPdf: "/api/convert/ppt-to-pdf",
    pdfToPowerpoint: "/api/convert/pdf-to-ppt",
    
    // Security
    protectPdf: "/api/security/protect",
    
    // Archive
    pdfToPdfa: "/api/convert/pdf-to-pdfa",
    
    // PDF Operations (for Android - returns download URL)
    mergePdf: "/api/pdf/merge",
    splitPdf: "/api/pdf/split",
    compressPdf: "/api/pdf/compress",
    rotatePdf: "/api/pdf/rotate",
    extractPages: "/api/pdf/extract",
    watermarkPdf: "/api/pdf/watermark",
    deletePages: "/api/pdf/delete-pages",
    reorderPages: "/api/pdf/reorder",
  },
};

// Helper to get full URL
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.endpoints): string => {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
};

// Check if we should use backend processing (for Android WebView)
export const shouldUseBackendProcessing = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  const isAndroidWebView = ua.includes('wv') || (ua.includes('android') && ua.includes('version/'));
  const isIOSWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(navigator.userAgent);
  return isAndroidWebView || isIOSWebView;
};
