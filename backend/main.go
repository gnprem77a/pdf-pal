package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
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
	mux.HandleFunc("/api/security/protect", handleProtect)

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
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
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
	copyFile(inputPath, outputPath)

	// Create text watermark
	wm, err := api.TextWatermark(text, "font:Helvetica, scale:1.0, opacity:0.3, rotation:45", true, false, model.POINTS)
	if err != nil {
		sendError(w, fmt.Sprintf("Watermark creation failed: %v", err), http.StatusInternalServerError)
		return
	}

	err = api.AddWatermarksFile(outputPath, "", nil, wm, nil)
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
	box, err := api.Box(boxDef, model.POINTS)
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
	if position == "" {
		position = "bc" // bottom center
	}

	outputPath := generateOutputPath("numbered", ".pdf")
	copyFile(inputPath, outputPath)

	// Add page numbers using stamps
	wm, err := api.TextWatermark("%p", fmt.Sprintf("font:Helvetica, scale:0.5, pos:%s", position), true, false, model.POINTS)
	if err != nil {
		sendError(w, fmt.Sprintf("Page number stamp failed: %v", err), http.StatusInternalServerError)
		return
	}

	err = api.AddWatermarksFile(outputPath, "", nil, wm, nil)
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
	copyFile(inputPath, outputPath)

	// Add header if provided
	if header != "" {
		wm, err := api.TextWatermark(header, "font:Helvetica, scale:0.5, pos:tc, offset:0 20", true, false, model.POINTS)
		if err == nil {
			api.AddWatermarksFile(outputPath, "", nil, wm, nil)
		}
	}

	// Add footer if provided
	if footer != "" {
		wm, err := api.TextWatermark(footer, "font:Helvetica, scale:0.5, pos:bc, offset:0 -20", true, false, model.POINTS)
		if err == nil {
			api.AddWatermarksFile(outputPath, "", nil, wm, nil)
		}
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
	copyFile(inputPath, outputPath)

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
		err = api.SetPropertiesFile(outputPath, "", props, nil)
		if err != nil {
			log.Printf("Metadata update warning: %v", err)
		}
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
	// Simple implementation - for production, use archive/zip
	files, err := filepath.Glob(filepath.Join(srcDir, "*.pdf"))
	if err != nil {
		return err
	}

	zipFile, err := os.Create(destZip)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	// Use archive/zip for proper implementation
	return createZip(files, zipFile)
}
