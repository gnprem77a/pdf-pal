# Go Backend API Specification

This document describes the API endpoints your Go backend needs to implement for the PDF tools.

## Base Configuration

Set the `VITE_API_URL` environment variable to your API Gateway URL when deploying:
```
VITE_API_URL=https://api.yourdomain.com
```

## Required Endpoints

### Health Check
```
GET /health
Response: 200 OK
```

### Office Conversions

#### Excel to PDF
```
POST /api/convert/excel-to-pdf
Content-Type: multipart/form-data

Form Fields:
- file: The Excel file (.xls or .xlsx)

Response: 
- Content-Type: application/pdf
- Body: The converted PDF file
```

#### PDF to Excel
```
POST /api/convert/pdf-to-excel
Content-Type: multipart/form-data

Form Fields:
- file: The PDF file

Response:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Body: The converted Excel file
```

#### PowerPoint to PDF
```
POST /api/convert/ppt-to-pdf
Content-Type: multipart/form-data

Form Fields:
- file: The PowerPoint file (.ppt or .pptx)

Response:
- Content-Type: application/pdf
- Body: The converted PDF file
```

#### PDF to PowerPoint
```
POST /api/convert/pdf-to-ppt
Content-Type: multipart/form-data

Form Fields:
- file: The PDF file

Response:
- Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
- Body: The converted PowerPoint file
```

### Security

#### Protect PDF
```
POST /api/security/protect
Content-Type: multipart/form-data

Form Fields:
- file: The PDF file
- password: The password to set

Response:
- Content-Type: application/pdf
- Body: The password-protected PDF file
```

### Archive Format

#### PDF to PDF/A
```
POST /api/convert/pdf-to-pdfa
Content-Type: multipart/form-data

Form Fields:
- file: The PDF file

Response:
- Content-Type: application/pdf
- Body: The PDF/A compliant file
```

### PDF Operations (Android-Compatible - Returns Download URL)

These endpoints process PDFs server-side and return a download URL. This is required for Android WebView compatibility since blob URLs don't work reliably.

#### Merge PDFs
```
POST /api/pdf/merge
Content-Type: multipart/form-data

Form Fields:
- file0, file1, file2...: PDF files to merge
- fileCount: Number of files

Response (JSON):
{
  "downloadUrl": "https://your-s3-bucket.s3.amazonaws.com/merged-abc123.pdf"
}
```

#### Split PDF
```
POST /api/pdf/split
Content-Type: multipart/form-data

Form Fields:
- file0: The PDF file
- ranges: JSON array of ranges, e.g., '[{"start":1,"end":3},{"start":5,"end":7}]'
- mode: (optional) "individual" to split into single pages

Response (JSON):
{
  "downloadUrl": "https://your-s3-bucket.s3.amazonaws.com/split-abc123.zip"
}
```

#### Compress PDF
```
POST /api/pdf/compress
Content-Type: multipart/form-data

Form Fields:
- file0: The PDF file

Response (JSON):
{
  "downloadUrl": "https://your-s3-bucket.s3.amazonaws.com/compressed-abc123.pdf"
}
```

#### Rotate PDF
```
POST /api/pdf/rotate
Content-Type: multipart/form-data

Form Fields:
- file0: The PDF file
- angle: Rotation angle (90, 180, 270)

Response (JSON):
{
  "downloadUrl": "https://your-s3-bucket.s3.amazonaws.com/rotated-abc123.pdf"
}
```

#### Extract Pages
```
POST /api/pdf/extract
Content-Type: multipart/form-data

Form Fields:
- file0: The PDF file
- pages: JSON array of page numbers, e.g., '[1,3,5,7]'

Response (JSON):
{
  "downloadUrl": "https://your-s3-bucket.s3.amazonaws.com/extracted-abc123.pdf"
}
```

#### Add Watermark
```
POST /api/pdf/watermark
Content-Type: multipart/form-data

Form Fields:
- file0: The PDF file
- text: Watermark text

Response (JSON):
{
  "downloadUrl": "https://your-s3-bucket.s3.amazonaws.com/watermarked-abc123.pdf"
}
```

#### Delete Pages
```
POST /api/pdf/delete-pages
Content-Type: multipart/form-data

Form Fields:
- file0: The PDF file
- pages: JSON array of page numbers to delete

Response (JSON):
{
  "downloadUrl": "https://your-s3-bucket.s3.amazonaws.com/deleted-abc123.pdf"
}
```

#### Reorder Pages
```
POST /api/pdf/reorder
Content-Type: multipart/form-data

Form Fields:
- file0: The PDF file
- order: JSON array of new page order, e.g., '[3,1,2,4]'

Response (JSON):
{
  "downloadUrl": "https://your-s3-bucket.s3.amazonaws.com/reordered-abc123.pdf"
}
```

## CORS Headers

Your backend MUST include these CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Recommended Go Libraries

| Feature | Library |
|---------|---------|
| HTTP Router | `github.com/gin-gonic/gin` or `github.com/gorilla/mux` |
| Office Conversions | LibreOffice (via `exec.Command`) |
| PDF Encryption | `github.com/unidoc/unipdf/v3` (or qpdf CLI) |
| PDF/A | Ghostscript CLI |
| PDF Manipulation | `github.com/pdfcpu/pdfcpu` |
| S3 Storage | `github.com/aws/aws-sdk-go-v2/service/s3` |

## Docker Setup for LibreOffice

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o server .

FROM alpine:3.19
RUN apk add --no-cache libreoffice ghostscript qpdf
COPY --from=builder /app/server /server
EXPOSE 8080
CMD ["/server"]
```

## AWS Architecture

```
                                    ┌──────────────────┐
                                    │   S3 Bucket      │
                                    │ (temp file store)│
                                    └────────┬─────────┘
                                             │
┌─────────────┐    ┌─────────────┐    ┌──────┴─────────┐
│   Frontend  │───▶│ API Gateway │───▶│  Lambda/ECS    │
│  (Lovable)  │    │             │    │  (Go + Docker) │
└─────────────┘    └─────────────┘    └────────────────┘
```

**S3 Bucket Configuration:**
- Enable public read access for download URLs (or use pre-signed URLs)
- Set lifecycle policy to delete files after 1 hour
- Use unique filenames with UUIDs

## Example Go Handler (Gin) - PDF Merge with S3

```go
package main

import (
    "context"
    "fmt"
    "os"
    "os/exec"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

var s3Client *s3.Client
var bucketName = os.Getenv("S3_BUCKET")

func init() {
    cfg, _ := config.LoadDefaultConfig(context.TODO())
    s3Client = s3.NewFromConfig(cfg)
}

func mergePDF(c *gin.Context) {
    fileCount := c.PostForm("fileCount")
    count := 0
    fmt.Sscanf(fileCount, "%d", &count)
    
    var inputFiles []string
    for i := 0; i < count; i++ {
        file, _ := c.FormFile(fmt.Sprintf("file%d", i))
        tempPath := fmt.Sprintf("/tmp/input_%d.pdf", i)
        c.SaveUploadedFile(file, tempPath)
        inputFiles = append(inputFiles, tempPath)
    }
    
    // Merge using pdfcpu
    outputPath := fmt.Sprintf("/tmp/merged_%s.pdf", uuid.New().String())
    args := append([]string{"merge", outputPath}, inputFiles...)
    exec.Command("pdfcpu", args...).Run()
    
    // Upload to S3
    outputFile, _ := os.Open(outputPath)
    defer outputFile.Close()
    
    key := fmt.Sprintf("merged-%s.pdf", uuid.New().String())
    s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
        Bucket: &bucketName,
        Key:    &key,
        Body:   outputFile,
        ContentType: aws.String("application/pdf"),
    })
    
    // Return download URL
    downloadUrl := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucketName, key)
    c.JSON(200, gin.H{"downloadUrl": downloadUrl})
}

func main() {
    r := gin.Default()
    r.Use(corsMiddleware())
    
    r.GET("/health", func(c *gin.Context) { c.Status(200) })
    r.POST("/api/convert/excel-to-pdf", excelToPDF)
    r.POST("/api/pdf/merge", mergePDF)
    // ... other routes
    
    r.Run(":8080")
}
```
