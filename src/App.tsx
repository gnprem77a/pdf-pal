import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MergePDF from "./pages/MergePDF";
import SplitPDF from "./pages/SplitPDF";
import CompressPDF from "./pages/CompressPDF";
import RotatePDF from "./pages/RotatePDF";
import WatermarkPDF from "./pages/WatermarkPDF";
import ProtectPDF from "./pages/ProtectPDF";
import WordToPDF from "./pages/WordToPDF";
import PDFToWord from "./pages/PDFToWord";
import PDFToImage from "./pages/PDFToImage";
import OCRPDF from "./pages/OCRPDF";
import EditPDF from "./pages/EditPDF";
import ImageToPDF from "./pages/ImageToPDF";
import PDFToText from "./pages/PDFToText";
import DeletePages from "./pages/DeletePages";
import AddPageNumbers from "./pages/AddPageNumbers";
import PDFMetadata from "./pages/PDFMetadata";
import ReorderPages from "./pages/ReorderPages";
import AddHeaderFooter from "./pages/AddHeaderFooter";
import UnlockPDF from "./pages/UnlockPDF";
import ESignPDF from "./pages/ESignPDF";
import AISummarize from "./pages/AISummarize";
import PDFChat from "./pages/PDFChat";
import TranslatePDF from "./pages/TranslatePDF";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/merge-pdf" element={<MergePDF />} />
          <Route path="/split-pdf" element={<SplitPDF />} />
          <Route path="/compress-pdf" element={<CompressPDF />} />
          <Route path="/rotate-pdf" element={<RotatePDF />} />
          <Route path="/watermark-pdf" element={<WatermarkPDF />} />
          <Route path="/protect-pdf" element={<ProtectPDF />} />
          <Route path="/word-to-pdf" element={<WordToPDF />} />
          <Route path="/pdf-to-word" element={<PDFToWord />} />
          <Route path="/pdf-to-image" element={<PDFToImage />} />
          <Route path="/ocr-pdf" element={<OCRPDF />} />
          <Route path="/edit-pdf" element={<EditPDF />} />
          <Route path="/image-to-pdf" element={<ImageToPDF />} />
          <Route path="/pdf-to-text" element={<PDFToText />} />
          <Route path="/delete-pages" element={<DeletePages />} />
          <Route path="/add-page-numbers" element={<AddPageNumbers />} />
          <Route path="/pdf-metadata" element={<PDFMetadata />} />
          <Route path="/reorder-pages" element={<ReorderPages />} />
          <Route path="/add-header-footer" element={<AddHeaderFooter />} />
          <Route path="/unlock-pdf" element={<UnlockPDF />} />
          <Route path="/esign-pdf" element={<ESignPDF />} />
          <Route path="/ai-summarize" element={<AISummarize />} />
          <Route path="/pdf-chat" element={<PDFChat />} />
          <Route path="/translate-pdf" element={<TranslatePDF />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
