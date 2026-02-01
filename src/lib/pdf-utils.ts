import { PDFDocument } from "pdf-lib";

/**
 * Get the page count of a PDF file (used for UI previews)
 * This is client-side only for displaying page count before upload
 */
export async function getPDFPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
}

/**
 * NOTE: All PDF processing has been moved to the backend.
 * 
 * The functions below are kept for reference but should NOT be used.
 * Use the backend API endpoints instead via the useBackendPdf hook.
 * 
 * Backend endpoints handle:
 * - Merge: POST /api/pdf/merge
 * - Split: POST /api/pdf/split
 * - Compress: POST /api/pdf/compress
 * - Rotate: POST /api/pdf/rotate
 * - Extract: POST /api/pdf/extract
 * - Watermark: POST /api/pdf/watermark
 * - Delete Pages: POST /api/pdf/delete-pages
 * - Reorder: POST /api/pdf/reorder
 * 
 * See BACKEND_API_SPEC.md for full documentation.
 */
