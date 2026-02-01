# Go Backend API Specification

This document describes the API endpoints implemented by the PDF processing backend.

**All processing is server-side. The frontend sends files and receives a download URL.**

## Base Configuration

Set the `VITE_API_URL` environment variable:
```
VITE_API_URL=https://api.yourdomain.com
```

## Response Format

All endpoints return JSON with a download URL:
```json
{
  "downloadUrl": "https://your-host/files/output-abc123.pdf"
}
```

## Error Response

```json
{
  "error": "Description of what went wrong"
}
```

## Privacy & Data Retention

- All uploaded/generated files are deleted automatically (default: 10 minutes)
- No user data persists after download
- Background cleanup runs every minute

---

## Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "dependencies": {
    "libreoffice": true,
    "tesseract": true,
    "ghostscript": true,
    "imagemagick": true
  }
}
```

---

## PDF Operations

All endpoints accept `multipart/form-data` with:
- `file0`, `file1`, etc.: The uploaded files
- `fileCount`: Number of files (for multi-file operations)
- Additional parameters as specified

### Merge PDFs
```
POST /api/pdf/merge
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0`, `file1`, ... | File | Yes | PDF files to merge |
| `fileCount` | Number | Yes | Number of files |

### Split PDF
```
POST /api/pdf/split
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file to split |
| `mode` | String | No | `individual` to split into single pages |
| `ranges` | JSON | No | `[{"start":1,"end":3},{"start":5,"end":7}]` |

Returns a ZIP file containing the split PDFs.

### Compress PDF
```
POST /api/pdf/compress
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file to compress |

### Rotate PDF
```
POST /api/pdf/rotate
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file to rotate |
| `angle` | Number | No | Rotation angle: 90, 180, 270 (default: 90) |

### Extract Pages
```
POST /api/pdf/extract
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `pages` | JSON | Yes | `[1,3,5,7]` - page numbers to extract |

### Add Watermark
```
POST /api/pdf/watermark
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `text` | String | No | Watermark text (default: "WATERMARK") |

### Delete Pages
```
POST /api/pdf/delete-pages
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `pages` | JSON | Yes | `[2,4,6]` - page numbers to delete |

### Reorder Pages
```
POST /api/pdf/reorder
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `order` | JSON | Yes | `[3,1,2,4]` - new page order |

### Crop PDF
```
POST /api/pdf/crop
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `top` | Number | Yes | Top margin in points |
| `right` | Number | Yes | Right margin in points |
| `bottom` | Number | Yes | Bottom margin in points |
| `left` | Number | Yes | Left margin in points |

### Repair PDF
```
POST /api/pdf/repair
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file to repair |

### Add Page Numbers
```
POST /api/pdf/add-page-numbers
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `position` | String | No | Position: bc, tc, tl, tr, bl, br (default: bc) |

### Add Header/Footer
```
POST /api/pdf/add-header-footer
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `header` | String | No | Header text |
| `footer` | String | No | Footer text |

### Update Metadata
```
POST /api/pdf/metadata
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `title` | String | No | Document title |
| `author` | String | No | Document author |
| `subject` | String | No | Document subject |
| `keywords` | String | No | Document keywords |

### Unlock PDF
```
POST /api/pdf/unlock
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | Password-protected PDF |
| `password` | String | Yes | PDF password |

### OCR PDF
```
POST /api/pdf/ocr
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF with scanned images |
| `language` | String | No | OCR language: eng, fra, deu, spa, etc. (default: eng) |

**Requires:** `ocrmypdf` and `tesseract-ocr`

### E-Sign PDF
```
POST /api/pdf/sign
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `signature` | String | Yes | Base64-encoded signature image |
| `page` | String | No | Page number to sign (default: 1) |

### Redact PDF
```
POST /api/pdf/redact
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `areas` | JSON | Yes | `[{"page":1,"x":100,"y":200,"width":50,"height":20}]` |

### Compare PDFs
```
POST /api/pdf/compare
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | First PDF |
| `file1` | File | Yes | Second PDF |

Returns a PDF with highlighted differences.

**Requires:** `ghostscript` and `imagemagick`

---

## Security

### Protect PDF
```
POST /api/security/protect
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `password` | String | Yes | Password to set |

---

## Conversions - To PDF

### Word to PDF
```
POST /api/convert/word-to-pdf
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | .doc or .docx file |

**Requires:** `libreoffice`

### Excel to PDF
```
POST /api/convert/excel-to-pdf
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | .xls or .xlsx file |

**Requires:** `libreoffice`

### PowerPoint to PDF
```
POST /api/convert/ppt-to-pdf
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | .ppt or .pptx file |

**Requires:** `libreoffice`

### Image to PDF
```
POST /api/convert/image-to-pdf
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0`, `file1`, ... | File | Yes | Image files |
| `fileCount` | Number | No | Number of images |

**Requires:** `imagemagick`

### HTML to PDF
```
POST /api/convert/html-to-pdf
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | HTML file |

**Requires:** `wkhtmltopdf` or `libreoffice`

---

## Conversions - From PDF

### PDF to Word
```
POST /api/convert/pdf-to-word
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |

Returns: .docx file

**Requires:** `libreoffice`

### PDF to Excel
```
POST /api/convert/pdf-to-excel
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |

Returns: .xlsx file

**Requires:** `libreoffice`

### PDF to PowerPoint
```
POST /api/convert/pdf-to-ppt
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |

Returns: .pptx file

**Requires:** `libreoffice`

### PDF to Image
```
POST /api/convert/pdf-to-image
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |
| `format` | String | No | Output format: png, jpg (default: png) |
| `dpi` | String | No | Resolution (default: 150) |

Returns: ZIP file with images

**Requires:** `ghostscript`

### PDF to Text
```
POST /api/convert/pdf-to-text
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |

Returns: .txt file

**Requires:** `poppler-utils` (pdftotext)

### PDF to PDF/A
```
POST /api/convert/pdf-to-pdfa
```
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file0` | File | Yes | PDF file |

Returns: PDF/A-2 compliant file

**Requires:** `ghostscript`

---

## CORS Headers

The backend includes these CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Required System Dependencies

| Feature | Package |
|---------|---------|
| Document conversions | `libreoffice` |
| OCR | `tesseract-ocr`, `ocrmypdf` |
| PDF/A, PDF to Image | `ghostscript` |
| Image processing | `imagemagick` |
| PDF text extraction | `poppler-utils` |
| HTML to PDF | `wkhtmltopdf` |

---

## Docker Deployment

```dockerfile
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    libreoffice \
    tesseract-ocr tesseract-ocr-eng \
    ocrmypdf \
    ghostscript \
    imagemagick \
    poppler-utils \
    wkhtmltopdf \
    fonts-liberation fonts-dejavu-core
```

See `backend/Dockerfile` for the complete configuration.
