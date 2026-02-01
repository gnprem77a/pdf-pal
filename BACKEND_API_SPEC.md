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

## Example Go Handler (Gin)

```go
package main

import (
    "os/exec"
    "github.com/gin-gonic/gin"
)

func excelToPDF(c *gin.Context) {
    file, _ := c.FormFile("file")
    
    // Save to temp
    tempPath := "/tmp/" + file.Filename
    c.SaveUploadedFile(file, tempPath)
    
    // Convert using LibreOffice
    outputPath := "/tmp/output.pdf"
    cmd := exec.Command("libreoffice", "--headless", "--convert-to", "pdf", 
        "--outdir", "/tmp", tempPath)
    cmd.Run()
    
    c.File(outputPath)
}

func main() {
    r := gin.Default()
    r.Use(corsMiddleware())
    
    r.GET("/health", func(c *gin.Context) { c.Status(200) })
    r.POST("/api/convert/excel-to-pdf", excelToPDF)
    // ... other routes
    
    r.Run(":8080")
}
```
