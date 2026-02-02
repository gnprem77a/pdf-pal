package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/types"
)

// Config
var (
	Port           = getEnv("PORT", "8080")
	Host           = getEnv("HOST", "http://localhost:8080")
	TempDir        = getEnv("TEMP_DIR", "./temp")
	FileTTLMinutes = getEnvInt("FILE_TTL_MINUTES", 10)
)

// FileInfo tracks temporary files for cleanup
type FileInfo struct {
	Path      string
	CreatedAt time.Time
}

var (
	fileRegistry = make(map[string]FileInfo)
	fileMutex    sync.RWMutex
)

func main() {
	// Ensure temp directory exists
	os.MkdirAll(TempDir, 0755)
	os.MkdirAll(filepath.Join(TempDir, "uploads"), 0755)
	os.MkdirAll(filepath.Join(TempDir, "output"), 0755)

	// Start cleanup goroutine
	go cleanupRoutine()

	// Setup routes
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", handleHealth)

	// Serve output files
	mux.HandleFunc("/files/", handleServeFile)

	// PDF Operations
	mux.HandleFunc("/api/pdf/merge", handleMerge)
	mux.HandleFunc("/api/pdf/split", handleSplit)
	mux.HandleFunc("/api/pdf/compress", handleCompress)
	mux.HandleFunc("/api/pdf/rotate", handleRotate)
	mux.HandleFunc("/api/pdf/extract", handleExtract)
	mux.HandleFunc("/api/pdf/watermark", handleWatermark)
	mux.HandleFunc("/api/pdf/delete-pages", handleDeletePages)
	mux.HandleFunc("/api/pdf/reorder", handleReorder)
	mux.HandleFunc("/api/pdf/crop", handleCrop)
	mux.HandleFunc("/api/pdf/repair", handleRepair)
	mux.HandleFunc("/api/pdf/add-page-numbers", handleAddPageNumbers)
	mux.HandleFunc("/api/pdf/add-header-footer", handleAddHeaderFooter)
	mux.HandleFunc("/api/pdf/metadata", handleMetadata)
	mux.HandleFunc("/api/pdf/unlock", handleUnlock)
	mux.HandleFunc("/api/pdf/ocr", handleOCR)
	mux.HandleFunc("/api/pdf/sign", handleSign)
	mux.HandleFunc("/api/pdf/redact", handleRedact)
	mux.HandleFunc("/api/pdf/compare", handleCompare)
	mux.HandleFunc("/api/pdf/batch", handleBatch)

	// Security
	mux.HandleFunc("/api/security/protect", handleProtect)

	// Conversions - To PDF
	mux.HandleFunc("/api/convert/word-to-pdf", handleWordToPDF)
	mux.HandleFunc("/api/convert/excel-to-pdf", handleExcelToPDF)
	mux.HandleFunc("/api/convert/ppt-to-pdf", handlePPTToPDF)
	mux.HandleFunc("/api/convert/image-to-pdf", handleImageToPDF)
	mux.HandleFunc("/api/convert/html-to-pdf", handleHTMLToPDF)

	// Conversions - From PDF
	mux.HandleFunc("/api/convert/pdf-to-word", handlePDFToWord)
	mux.HandleFunc("/api/convert/pdf-to-excel", handlePDFToExcel)
	mux.HandleFunc("/api/convert/pdf-to-ppt", handlePDFToPPT)
	mux.HandleFunc("/api/convert/pdf-to-image", handlePDFToImage)
	mux.HandleFunc("/api/convert/pdf-to-text", handlePDFToText)
	mux.HandleFunc("/api/convert/pdf-to-pdfa", handlePDFToPDFA)

	// Wrap with CORS
	handler := corsMiddleware(mux)

	log.Printf("🚀 PDF Processing Server starting on port %s", Port)
	log.Printf("📁 Temp directory: %s", TempDir)
	log.Printf("⏱️  File TTL: %d minutes", FileTTLMinutes)
	log.Fatal(http.ListenAndServe(":"+Port, handler))
}

// CORS Middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Health check
func handleHealth(w http.ResponseWriter, r *http.Request) {
	// Check system dependencies
	deps := map[string]bool{
		"libreoffice": checkCommand("libreoffice", "--version"),
		"tesseract":   checkCommand("tesseract", "--version"),
		"ghostscript": checkCommand("gs", "--version"),
		"imagemagick": checkCommand("convert", "--version"),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "ok",
		"dependencies": deps,
	})
}

func checkCommand(name string, args ...string) bool {
	cmd := exec.Command(name, args...)
	return cmd.Run() == nil
}

// Serve output files
func handleServeFile(w http.ResponseWriter, r *http.Request) {
	filename := strings.TrimPrefix(r.URL.Path, "/files/")
	filePath := filepath.Join(TempDir, "output", filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "File not found or expired", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	http.ServeFile(w, r, filePath)
}

// Response helper
func sendDownloadResponse(w http.ResponseWriter, filename string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"downloadUrl": fmt.Sprintf("%s/files/%s", Host, filename),
	})
}

func sendError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// Register file for cleanup
func registerFile(path string) {
	fileMutex.Lock()
	defer fileMutex.Unlock()
	fileRegistry[path] = FileInfo{Path: path, CreatedAt: time.Now()}
}

// Cleanup routine
func cleanupRoutine() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		cleanupExpiredFiles()
	}
}

func cleanupExpiredFiles() {
	fileMutex.Lock()
	defer fileMutex.Unlock()

	ttl := time.Duration(FileTTLMinutes) * time.Minute
	now := time.Now()
	deleted := 0

	for path, info := range fileRegistry {
		if now.Sub(info.CreatedAt) > ttl {
			os.Remove(path)
			delete(fileRegistry, path)
			deleted++
		}
	}

	if deleted > 0 {
		log.Printf("🧹 Cleaned up %d expired files", deleted)
	}
}

// Save uploaded file to temp
func saveUploadedFile(r *http.Request, key string) (string, error) {
	file, header, err := r.FormFile(key)
	if err != nil {
		return "", err
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".pdf"
	}
	tempPath := filepath.Join(TempDir, "uploads", uuid.New().String()+ext)

	out, err := os.Create(tempPath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		return "", err
	}

	registerFile(tempPath)
	return tempPath, nil
}

// Generate output path
func generateOutputPath(prefix, ext string) string {
	filename := fmt.Sprintf("%s-%s%s", prefix, uuid.New().String()[:8], ext)
	path := filepath.Join(TempDir, "output", filename)
	registerFile(path)
	return path
}

// ==================== PDF HANDLERS ====================

// POST /api/pdf/merge
func handleMerge(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(100 << 20) // 100MB max

	fileCountStr := r.FormValue("fileCount")
	fileCount, _ := strconv.Atoi(fileCountStr)
	if fileCount < 2 {
		sendError(w, "At least 2 files required", http.StatusBadRequest)
		return
	}

	var inputFiles []string
	for i := 0; i < fileCount; i++ {
		path, err := saveUploadedFile(r, fmt.Sprintf("file%d", i))
		if err != nil {
			sendError(w, fmt.Sprintf("Failed to read file%d: %v", i, err), http.StatusBadRequest)
			return
		}
		inputFiles = append(inputFiles, path)
	}

	outputPath := generateOutputPath("merged", ".pdf")

	err := api.MergeCreateFile(inputFiles, outputPath, false, nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Merge failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/split
func handleSplit(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	mode := r.FormValue("mode")
	rangesStr := r.FormValue("ranges")

	outputDir := filepath.Join(TempDir, "output", "split-"+uuid.New().String()[:8])
	os.MkdirAll(outputDir, 0755)

	if mode == "individual" {
		// Split into individual pages
		err = api.SplitFile(inputPath, outputDir, 1, nil)
	} else if rangesStr != "" {
		// Parse ranges like '[{"start":1,"end":3}]'
		var ranges []struct {
			Start int `json:"start"`
			End   int `json:"end"`
		}
		json.Unmarshal([]byte(rangesStr), &ranges)

		for i, rng := range ranges {
			pageSelection := []string{fmt.Sprintf("%d-%d", rng.Start, rng.End)}
			outFile := filepath.Join(outputDir, fmt.Sprintf("pages_%d-%d.pdf", rng.Start, rng.End))
			err = api.ExtractPagesFile(inputPath, outFile, pageSelection, nil)
			if err != nil {
				log.Printf("Range %d extraction failed: %v", i, err)
			}
		}
	} else {
		sendError(w, "Either 'mode=individual' or 'ranges' required", http.StatusBadRequest)
		return
	}

	// Create ZIP of output files
	zipPath := generateOutputPath("split", ".zip")
	err = createZipFromDir(outputDir, zipPath)
	if err != nil {
		sendError(w, fmt.Sprintf("ZIP creation failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Cleanup split directory
	os.RemoveAll(outputDir)

	sendDownloadResponse(w, filepath.Base(zipPath))
}

// POST /api/pdf/compress
func handleCompress(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	outputPath := generateOutputPath("compressed", ".pdf")

	// Use optimization for compression
	conf := model.NewDefaultConfiguration()
	err = api.OptimizeFile(inputPath, outputPath, conf)
	if err != nil {
		sendError(w, fmt.Sprintf("Compression failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/rotate
func handleRotate(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	angleStr := r.FormValue("angle")
	angle, _ := strconv.Atoi(angleStr)
	if angle == 0 {
		angle = 90
	}

	outputPath := generateOutputPath("rotated", ".pdf")

	// Copy input to output first, then rotate in place
	copyFile(inputPath, outputPath)

	err = api.RotateFile(outputPath, "", angle, nil, nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Rotation failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/extract
func handleExtract(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	pagesStr := r.FormValue("pages")
	var pages []int
	json.Unmarshal([]byte(pagesStr), &pages)

	if len(pages) == 0 {
		sendError(w, "No pages specified", http.StatusBadRequest)
		return
	}

	// Convert to page selection strings
	var pageSelection []string
	for _, p := range pages {
		pageSelection = append(pageSelection, strconv.Itoa(p))
	}

	outputPath := generateOutputPath("extracted", ".pdf")

	err = api.ExtractPagesFile(inputPath, outputPath, pageSelection, nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Extraction failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/watermark
func handleWatermark(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	text := r.FormValue("text")
	if text == "" {
		text = "WATERMARK"
	}

	outputPath := generateOutputPath("watermarked", ".pdf")

	// Add text watermark using AddTextWatermarksFile
	err = api.AddTextWatermarksFile(inputPath, outputPath, nil, false, text, "font:Helvetica, scale:1.0, opacity:0.3, rotation:45", nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Watermark failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/delete-pages
func handleDeletePages(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	pagesStr := r.FormValue("pages")
	var pages []int
	json.Unmarshal([]byte(pagesStr), &pages)

	if len(pages) == 0 {
		sendError(w, "No pages specified", http.StatusBadRequest)
		return
	}

	// Convert to page selection strings
	var pageSelection []string
	for _, p := range pages {
		pageSelection = append(pageSelection, strconv.Itoa(p))
	}

	outputPath := generateOutputPath("deleted-pages", ".pdf")
	copyFile(inputPath, outputPath)

	err = api.RemovePagesFile(outputPath, "", pageSelection, nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Delete pages failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/reorder
func handleReorder(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	orderStr := r.FormValue("order")
	var order []int
	json.Unmarshal([]byte(orderStr), &order)

	if len(order) == 0 {
		sendError(w, "No order specified", http.StatusBadRequest)
		return
	}

	// Build page selection string for collect
	var pageSelection []string
	for _, p := range order {
		pageSelection = append(pageSelection, strconv.Itoa(p))
	}

	outputPath := generateOutputPath("reordered", ".pdf")

	err = api.CollectFile(inputPath, outputPath, pageSelection, nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Reorder failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/crop
func handleCrop(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	top, _ := strconv.ParseFloat(r.FormValue("top"), 64)
	right, _ := strconv.ParseFloat(r.FormValue("right"), 64)
	bottom, _ := strconv.ParseFloat(r.FormValue("bottom"), 64)
	left, _ := strconv.ParseFloat(r.FormValue("left"), 64)

	outputPath := generateOutputPath("cropped", ".pdf")
	copyFile(inputPath, outputPath)

	// Create crop box
	boxDef := fmt.Sprintf("[%.2f %.2f %.2f %.2f]", left, bottom, right, top)
	box, err := api.Box(boxDef, types.POINTS)
	if err != nil {
		sendError(w, fmt.Sprintf("Invalid crop dimensions: %v", err), http.StatusBadRequest)
		return
	}

	err = api.CropFile(outputPath, "", nil, box, nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Crop failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/repair
func handleRepair(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	outputPath := generateOutputPath("repaired", ".pdf")

	// Optimize acts as a repair by rebuilding the PDF
	conf := model.NewDefaultConfiguration()
	err = api.OptimizeFile(inputPath, outputPath, conf)
	if err != nil {
		sendError(w, fmt.Sprintf("Repair failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/add-page-numbers
func handleAddPageNumbers(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	position := r.FormValue("position")
	// Map frontend positions to pdfcpu anchor positions
	posMap := map[string]string{
		"bottom-center": "bc",
		"bottom-left":   "bl",
		"bottom-right":  "br",
		"top-center":    "tc",
		"top-left":      "tl",
		"top-right":     "tr",
	}
	pos, ok := posMap[position]
	if !ok {
		pos = "bc" // default to bottom center
	}

	outputPath := generateOutputPath("numbered", ".pdf")

	// Add page numbers using absolute font size (no scale)
	err = api.AddTextWatermarksFile(inputPath, outputPath, nil, true, "%p", fmt.Sprintf("font:Helvetica, points:10, pos:%s", pos), nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Add page numbers failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/add-header-footer
func handleAddHeaderFooter(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	header := r.FormValue("header")
	footer := r.FormValue("footer")

	outputPath := generateOutputPath("header-footer", ".pdf")
	currentInput := inputPath

	// Add header if provided (using absolute font size)
	if header != "" {
		err = api.AddTextWatermarksFile(currentInput, outputPath, nil, true, header, "font:Helvetica, points:10, pos:tc, offset:0 20", nil)
		if err != nil {
			log.Printf("Header addition warning: %v", err)
			copyFile(inputPath, outputPath)
		}
		currentInput = outputPath
	}

	// Add footer if provided (using absolute font size)
	if footer != "" {
		if header != "" {
			tempOutput := generateOutputPath("header-footer-temp", ".pdf")
			err = api.AddTextWatermarksFile(currentInput, tempOutput, nil, true, footer, "font:Helvetica, points:10, pos:bc, offset:0 -20", nil)
			if err != nil {
				log.Printf("Footer addition warning: %v", err)
			} else {
				copyFile(tempOutput, outputPath)
			}
			os.Remove(tempOutput)
		} else {
			err = api.AddTextWatermarksFile(currentInput, outputPath, nil, true, footer, "font:Helvetica, points:10, pos:bc, offset:0 -20", nil)
			if err != nil {
				log.Printf("Footer addition warning: %v", err)
				copyFile(inputPath, outputPath)
			}
		}
	}

	// If neither header nor footer, just copy
	if header == "" && footer == "" {
		copyFile(inputPath, outputPath)
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/metadata
func handleMetadata(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	outputPath := generateOutputPath("metadata", ".pdf")

	// Build properties map
	props := make(map[string]string)
	if title := r.FormValue("title"); title != "" {
		props["Title"] = title
	}
	if author := r.FormValue("author"); author != "" {
		props["Author"] = author
	}
	if subject := r.FormValue("subject"); subject != "" {
		props["Subject"] = subject
	}
	if keywords := r.FormValue("keywords"); keywords != "" {
		props["Keywords"] = keywords
	}

	if len(props) > 0 {
		err = api.AddPropertiesFile(inputPath, outputPath, props, nil)
		if err != nil {
			log.Printf("Metadata update warning: %v", err)
			copyFile(inputPath, outputPath)
		}
	} else {
		copyFile(inputPath, outputPath)
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/unlock
func handleUnlock(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	password := r.FormValue("password")

	outputPath := generateOutputPath("unlocked", ".pdf")

	conf := model.NewDefaultConfiguration()
	conf.UserPW = password
	conf.OwnerPW = password

	err = api.DecryptFile(inputPath, outputPath, conf)
	if err != nil {
		sendError(w, fmt.Sprintf("Unlock failed (wrong password?): %v", err), http.StatusBadRequest)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/security/protect
func handleProtect(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	password := r.FormValue("password")
	if password == "" {
		sendError(w, "Password required", http.StatusBadRequest)
		return
	}

	outputPath := generateOutputPath("protected", ".pdf")

	conf := model.NewDefaultConfiguration()
	conf.UserPW = password
	conf.OwnerPW = password

	err = api.EncryptFile(inputPath, outputPath, conf)
	if err != nil {
		sendError(w, fmt.Sprintf("Protect failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/ocr
func handleOCR(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	language := r.FormValue("language")
	if language == "" {
		language = "eng"
	}

	outputPath := generateOutputPath("ocr", ".pdf")

	// Use Tesseract via ocrmypdf for best results
	cmd := exec.Command("ocrmypdf",
		"--language", language,
		"--skip-text",           // Skip pages that already have text
		"--optimize", "1",       // Light optimization
		"--output-type", "pdf",
		inputPath, outputPath)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("OCR output: %s", string(output))
		sendError(w, fmt.Sprintf("OCR failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/sign
func handleSign(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	// Get signature image (base64 or file)
	signatureData := r.FormValue("signature")
	if signatureData == "" {
		sendError(w, "Signature required", http.StatusBadRequest)
		return
	}

	// Decode base64 signature to temp file
	signaturePath := filepath.Join(TempDir, "uploads", uuid.New().String()+".png")
	
	// Remove data URL prefix if present
	if strings.HasPrefix(signatureData, "data:image") {
		parts := strings.SplitN(signatureData, ",", 2)
		if len(parts) == 2 {
			signatureData = parts[1]
		}
	}

	// Decode base64
	decoded, err := base64.StdEncoding.DecodeString(signatureData)
	if err != nil {
		sendError(w, "Invalid signature data", http.StatusBadRequest)
		return
	}
	
	err = os.WriteFile(signaturePath, decoded, 0644)
	if err != nil {
		sendError(w, "Failed to save signature", http.StatusInternalServerError)
		return
	}
	registerFile(signaturePath)

	// Get position parameters
	page := r.FormValue("page")
	if page == "" {
		page = "1"
	}

	outputPath := generateOutputPath("signed", ".pdf")

	// Use pdfcpu to add image stamp
	err = api.AddImageWatermarksFile(inputPath, outputPath, []string{page}, true, signaturePath, "scale:0.3, pos:br, offset:-50 50", nil)
	if err != nil {
		sendError(w, fmt.Sprintf("Signing failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/redact
func handleRedact(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	// Get redaction areas (JSON array of rectangles with page numbers)
	areasStr := r.FormValue("areas")
	if areasStr == "" {
		sendError(w, "Redaction areas required", http.StatusBadRequest)
		return
	}

	var areas []struct {
		Page   int     `json:"page"`
		X      float64 `json:"x"`
		Y      float64 `json:"y"`
		Width  float64 `json:"width"`
		Height float64 `json:"height"`
	}
	json.Unmarshal([]byte(areasStr), &areas)

	outputPath := generateOutputPath("redacted", ".pdf")
	copyFile(inputPath, outputPath)

	// Apply black rectangles for each redaction area using annotations
	for _, area := range areas {
		// Use pdfcpu annotations API to add black rectangles
		// This is a simplified approach - full implementation would use proper redaction
		desc := fmt.Sprintf("pos:bl, offset:%.0f %.0f, scale:abs, width:%.0f, height:%.0f, bgcolor:#000000", 
			area.X, area.Y, area.Width, area.Height)
		
		api.AddTextWatermarksFile(outputPath, outputPath, []string{strconv.Itoa(area.Page)}, true, " ", desc, nil)
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/pdf/compare
func handleCompare(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(100 << 20)

	file1Path, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read first file", http.StatusBadRequest)
		return
	}

	file2Path, err := saveUploadedFile(r, "file1")
	if err != nil {
		sendError(w, "Failed to read second file", http.StatusBadRequest)
		return
	}

	outputPath := generateOutputPath("comparison", ".pdf")

	// Convert PDFs to images, compare, and create difference PDF
	// Using ImageMagick for comparison
	tempDir := filepath.Join(TempDir, "compare-"+uuid.New().String()[:8])
	os.MkdirAll(tempDir, 0755)
	defer os.RemoveAll(tempDir)

	// Convert first PDF to images
	cmd := exec.Command("gs", "-dNOPAUSE", "-dBATCH", "-sDEVICE=png16m", "-r150",
		fmt.Sprintf("-sOutputFile=%s/page1-%%d.png", tempDir), file1Path)
	cmd.Run()

	// Convert second PDF to images
	cmd = exec.Command("gs", "-dNOPAUSE", "-dBATCH", "-sDEVICE=png16m", "-r150",
		fmt.Sprintf("-sOutputFile=%s/page2-%%d.png", tempDir), file2Path)
	cmd.Run()

	// Find all page images and compare
	var diffImages []string
	for i := 1; ; i++ {
		img1 := filepath.Join(tempDir, fmt.Sprintf("page1-%d.png", i))
		img2 := filepath.Join(tempDir, fmt.Sprintf("page2-%d.png", i))
		diffImg := filepath.Join(tempDir, fmt.Sprintf("diff-%d.png", i))

		if _, err := os.Stat(img1); os.IsNotExist(err) {
			break
		}

		// Use ImageMagick to create difference image
		if _, err := os.Stat(img2); err == nil {
			cmd = exec.Command("compare", "-highlight-color", "red", img1, img2, diffImg)
			cmd.Run()
		} else {
			// If page doesn't exist in second PDF, just use first
			copyFile(img1, diffImg)
		}
		diffImages = append(diffImages, diffImg)
	}

	// Convert diff images back to PDF
	if len(diffImages) > 0 {
		args := append(diffImages, outputPath)
		cmd = exec.Command("convert", args...)
		err = cmd.Run()
		if err != nil {
			sendError(w, fmt.Sprintf("Comparison failed: %v", err), http.StatusInternalServerError)
			return
		}
	} else {
		sendError(w, "No pages to compare", http.StatusBadRequest)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// ==================== CONVERSION HANDLERS ====================

// POST /api/convert/word-to-pdf
func handleWordToPDF(w http.ResponseWriter, r *http.Request) {
	handleLibreOfficeConvert(w, r, "word", ".pdf")
}

// POST /api/convert/excel-to-pdf
func handleExcelToPDF(w http.ResponseWriter, r *http.Request) {
	handleLibreOfficeConvert(w, r, "excel", ".pdf")
}

// POST /api/convert/ppt-to-pdf
func handlePPTToPDF(w http.ResponseWriter, r *http.Request) {
	handleLibreOfficeConvert(w, r, "ppt", ".pdf")
}

// POST /api/convert/html-to-pdf
func handleHTMLToPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	outputPath := generateOutputPath("html-converted", ".pdf")

	// Use wkhtmltopdf or LibreOffice for HTML conversion
	cmd := exec.Command("wkhtmltopdf", inputPath, outputPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Fallback to LibreOffice
		log.Printf("wkhtmltopdf failed, trying LibreOffice: %s", string(output))
		handleLibreOfficeConvert(w, r, "html", ".pdf")
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/convert/image-to-pdf
func handleImageToPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(100 << 20)

	// Support multiple images
	fileCountStr := r.FormValue("fileCount")
	fileCount, _ := strconv.Atoi(fileCountStr)
	if fileCount == 0 {
		fileCount = 1
	}

	var inputFiles []string
	for i := 0; i < fileCount; i++ {
		path, err := saveUploadedFile(r, fmt.Sprintf("file%d", i))
		if err != nil {
			if i == 0 {
				sendError(w, "Failed to read image file", http.StatusBadRequest)
				return
			}
			break
		}
		inputFiles = append(inputFiles, path)
	}

	outputPath := generateOutputPath("images-to-pdf", ".pdf")

	// Use ImageMagick to convert images to PDF
	args := append(inputFiles, outputPath)
	cmd := exec.Command("convert", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("ImageMagick output: %s", string(output))
		sendError(w, fmt.Sprintf("Image to PDF conversion failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/convert/pdf-to-word
func handlePDFToWord(w http.ResponseWriter, r *http.Request) {
	handleLibreOfficeConvert(w, r, "pdf-to-word", ".docx")
}

// POST /api/convert/pdf-to-excel
func handlePDFToExcel(w http.ResponseWriter, r *http.Request) {
	handleLibreOfficeConvert(w, r, "pdf-to-excel", ".xlsx")
}

// POST /api/convert/pdf-to-ppt
func handlePDFToPPT(w http.ResponseWriter, r *http.Request) {
	handleLibreOfficeConvert(w, r, "pdf-to-ppt", ".pptx")
}

// POST /api/convert/pdf-to-image
func handlePDFToImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	format := r.FormValue("format")
	if format == "" {
		format = "png"
	}

	dpi := r.FormValue("dpi")
	if dpi == "" {
		dpi = "150"
	}

	outputDir := filepath.Join(TempDir, "output", "images-"+uuid.New().String()[:8])
	os.MkdirAll(outputDir, 0755)

	// Use Ghostscript to convert PDF to images
	device := "png16m"
	if format == "jpg" || format == "jpeg" {
		device = "jpeg"
	}

	cmd := exec.Command("gs",
		"-dNOPAUSE", "-dBATCH",
		"-sDEVICE="+device,
		"-r"+dpi,
		fmt.Sprintf("-sOutputFile=%s/page-%%d.%s", outputDir, format),
		inputPath)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Ghostscript output: %s", string(output))
		sendError(w, fmt.Sprintf("PDF to image conversion failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Create ZIP of images
	zipPath := generateOutputPath("pdf-images", ".zip")
	err = createZipFromDir(outputDir, zipPath)
	if err != nil {
		sendError(w, fmt.Sprintf("ZIP creation failed: %v", err), http.StatusInternalServerError)
		return
	}

	os.RemoveAll(outputDir)
	sendDownloadResponse(w, filepath.Base(zipPath))
}

// POST /api/convert/pdf-to-text
func handlePDFToText(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	outputPath := generateOutputPath("extracted-text", ".txt")

	// Use pdftotext from poppler-utils
	cmd := exec.Command("pdftotext", "-layout", inputPath, outputPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("pdftotext output: %s", string(output))
		sendError(w, fmt.Sprintf("Text extraction failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// POST /api/convert/pdf-to-pdfa
func handlePDFToPDFA(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	outputPath := generateOutputPath("pdfa", ".pdf")

	// Use Ghostscript to convert to PDF/A
	cmd := exec.Command("gs",
		"-dPDFA=2",
		"-dBATCH", "-dNOPAUSE",
		"-sColorConversionStrategy=UseDeviceIndependentColor",
		"-sDEVICE=pdfwrite",
		"-dPDFACompatibilityPolicy=1",
		fmt.Sprintf("-sOutputFile=%s", outputPath),
		inputPath)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Ghostscript PDF/A output: %s", string(output))
		sendError(w, fmt.Sprintf("PDF/A conversion failed: %v", err), http.StatusInternalServerError)
		return
	}

	sendDownloadResponse(w, filepath.Base(outputPath))
}

// Generic LibreOffice conversion handler
func handleLibreOfficeConvert(w http.ResponseWriter, r *http.Request, convType, outputExt string) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(50 << 20)

	inputPath, err := saveUploadedFile(r, "file0")
	if err != nil {
		sendError(w, "Failed to read file", http.StatusBadRequest)
		return
	}

	outputDir := filepath.Join(TempDir, "output")

	// Determine output format for LibreOffice
	var convertFormat string
	switch convType {
	case "word", "excel", "ppt", "html":
		convertFormat = "pdf"
	case "pdf-to-word":
		convertFormat = "docx"
	case "pdf-to-excel":
		convertFormat = "xlsx"
	case "pdf-to-ppt":
		convertFormat = "pptx"
	default:
		convertFormat = "pdf"
	}

	// Run LibreOffice headless conversion
	// Use -env:UserInstallation to keep profile under /app (not /home)
	cmd := exec.Command("libreoffice",
		"--headless",
		"-env:UserInstallation=file:///app/.config/libreoffice",
		"--convert-to", convertFormat,
		"--outdir", outputDir,
		inputPath)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("LibreOffice output: %s", string(output))
		sendError(w, fmt.Sprintf("Conversion failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Find the converted file
	baseName := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))
	convertedFile := filepath.Join(outputDir, baseName+"."+convertFormat)

	// Rename to our standard naming convention
	finalPath := generateOutputPath("converted", outputExt)
	err = os.Rename(convertedFile, finalPath)
	if err != nil {
		// Try copy if rename fails (cross-device)
		copyFile(convertedFile, finalPath)
		os.Remove(convertedFile)
	}

	sendDownloadResponse(w, filepath.Base(finalPath))
}

// POST /api/pdf/batch - Batch compress multiple PDFs
func handleBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseMultipartForm(200 << 20) // 200MB max

	operation := r.FormValue("operation")
	if operation == "" {
		operation = "compress"
	}

	fileCountStr := r.FormValue("fileCount")
	fileCount, _ := strconv.Atoi(fileCountStr)
	if fileCount == 0 {
		sendError(w, "No files provided", http.StatusBadRequest)
		return
	}

	// For merge, use the merge handler
	if operation == "merge" {
		handleMerge(w, r)
		return
	}

	// For compress, process each file and zip results
	outputDir := filepath.Join(TempDir, "output", "batch-"+uuid.New().String()[:8])
	os.MkdirAll(outputDir, 0755)

	for i := 0; i < fileCount; i++ {
		inputPath, err := saveUploadedFile(r, fmt.Sprintf("file%d", i))
		if err != nil {
			continue
		}

		// Get original filename for output
		file, header, _ := r.FormFile(fmt.Sprintf("file%d", i))
		if file != nil {
			file.Close()
		}
		baseName := strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename))

		outputPath := filepath.Join(outputDir, fmt.Sprintf("%s-compressed.pdf", baseName))

		// Compress using optimize
		conf := model.NewDefaultConfiguration()
		err = api.OptimizeFile(inputPath, outputPath, conf)
		if err != nil {
			log.Printf("Batch compress failed for file %d: %v", i, err)
			continue
		}
	}

	// Create ZIP of all compressed files
	zipPath := generateOutputPath("batch-compressed", ".zip")
	err := createZipFromDir(outputDir, zipPath)
	if err != nil {
		sendError(w, fmt.Sprintf("ZIP creation failed: %v", err), http.StatusInternalServerError)
		return
	}

	os.RemoveAll(outputDir)
	sendDownloadResponse(w, filepath.Base(zipPath))
}

// ==================== UTILITIES ====================

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

func copyFile(src, dst string) error {
	source, err := os.Open(src)
	if err != nil {
		return err
	}
	defer source.Close()

	dest, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dest.Close()

	_, err = io.Copy(dest, source)
	return err
}

func createZipFromDir(srcDir, destZip string) error {
	files, err := filepath.Glob(filepath.Join(srcDir, "*"))
	if err != nil {
		return err
	}

	zipFile, err := os.Create(destZip)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	return createZip(files, zipFile)
}
