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
  },
};

// Helper to get full URL
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.endpoints): string => {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
};
