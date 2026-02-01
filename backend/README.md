# PDF Processing Backend

A comprehensive Go-based PDF processing API with full document conversion support.

## Quick Start

```bash
# Install dependencies
go mod tidy

# Run the server (requires system dependencies)
go run .

# Server starts on http://localhost:8080
```

## System Dependencies

For full functionality, install these system packages:

### Ubuntu/Debian
```bash
sudo apt-get install -y \
    libreoffice \
    tesseract-ocr tesseract-ocr-eng \
    ocrmypdf \
    ghostscript \
    imagemagick \
    poppler-utils \
    wkhtmltopdf
```

### Alpine
```bash
apk add libreoffice tesseract-ocr ghostscript imagemagick poppler-utils
```

### macOS
```bash
brew install libreoffice tesseract ghostscript imagemagick poppler
```

## Docker (Recommended)

Docker is the recommended deployment method as it includes all dependencies:

```bash
# Build
docker build -t pdf-backend .

# Run
docker run -p 8080:8080 \
  -e HOST=https://api.yourdomain.com \
  -e FILE_TTL_MINUTES=5 \
  pdf-backend
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `HOST` | `http://localhost:8080` | Public URL for download links |
| `TEMP_DIR` | `./temp` | Directory for temporary files |
| `FILE_TTL_MINUTES` | `10` | Minutes before files are deleted |

## API Endpoints

All endpoints accept `multipart/form-data` and return:
```json
{
  "downloadUrl": "https://your-host/files/output-abc123.pdf"
}
```

### PDF Operations

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/api/pdf/merge` | POST | `file0`, `file1`, ..., `fileCount` |
| `/api/pdf/split` | POST | `file0`, `mode=individual` or `ranges=[{"start":1,"end":3}]` |
| `/api/pdf/compress` | POST | `file0` |
| `/api/pdf/rotate` | POST | `file0`, `angle` (90, 180, 270) |
| `/api/pdf/extract` | POST | `file0`, `pages=[1,3,5]` |
| `/api/pdf/watermark` | POST | `file0`, `text` |
| `/api/pdf/delete-pages` | POST | `file0`, `pages=[2,4,6]` |
| `/api/pdf/reorder` | POST | `file0`, `order=[3,1,2,4]` |
| `/api/pdf/crop` | POST | `file0`, `top`, `right`, `bottom`, `left` |
| `/api/pdf/repair` | POST | `file0` |
| `/api/pdf/add-page-numbers` | POST | `file0`, `position` (bc, tl, tr, etc.) |
| `/api/pdf/add-header-footer` | POST | `file0`, `header`, `footer` |
| `/api/pdf/metadata` | POST | `file0`, `title`, `author`, `subject`, `keywords` |
| `/api/pdf/unlock` | POST | `file0`, `password` |
| `/api/pdf/ocr` | POST | `file0`, `language` (eng, fra, deu, etc.) |
| `/api/pdf/sign` | POST | `file0`, `signature` (base64 image), `page` |
| `/api/pdf/redact` | POST | `file0`, `areas` (JSON array of rectangles) |
| `/api/pdf/compare` | POST | `file0`, `file1` |

### Security

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/api/security/protect` | POST | `file0`, `password` |

### Conversions - To PDF

| Endpoint | Method | Input Types |
|----------|--------|-------------|
| `/api/convert/word-to-pdf` | POST | .doc, .docx |
| `/api/convert/excel-to-pdf` | POST | .xls, .xlsx |
| `/api/convert/ppt-to-pdf` | POST | .ppt, .pptx |
| `/api/convert/image-to-pdf` | POST | .jpg, .png, .gif, .bmp |
| `/api/convert/html-to-pdf` | POST | .html |

### Conversions - From PDF

| Endpoint | Method | Output Type |
|----------|--------|-------------|
| `/api/convert/pdf-to-word` | POST | .docx |
| `/api/convert/pdf-to-excel` | POST | .xlsx |
| `/api/convert/pdf-to-ppt` | POST | .pptx |
| `/api/convert/pdf-to-image` | POST | .zip (PNG/JPG images) |
| `/api/convert/pdf-to-text` | POST | .txt |
| `/api/convert/pdf-to-pdfa` | POST | PDF/A-2 |

### Other

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with dependency status |
| `/files/{filename}` | GET | Download processed files |

## Health Check Response

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

## AWS Deployment

### EC2 (Recommended for heavy workloads)

1. Launch an EC2 instance (t3.medium or larger recommended)
2. Install Docker: `sudo yum install -y docker && sudo systemctl start docker`
3. Build and push to ECR
4. Run with Docker
5. Configure ALB for HTTPS
6. Set `HOST` to your domain

### ECS/Fargate

1. Push Docker image to ECR
2. Create ECS task definition with:
   - Memory: 2GB minimum (LibreOffice needs memory)
   - CPU: 1 vCPU minimum
   - Timeout: 5 minutes for large files
3. Create ECS service with ALB
4. Configure environment variables

### Lambda (Limited)

⚠️ Lambda has constraints that make it challenging for this backend:
- 15-minute timeout (document conversions can be slow)
- 10GB ephemeral storage limit
- Cold starts with LibreOffice are slow (~30s)

Consider Lambda only for simple PDF operations, not document conversions.

## Privacy & Security

- All uploaded files are deleted automatically after `FILE_TTL_MINUTES`
- Background cleanup runs every minute
- No user data is persisted
- CORS is configured for cross-origin requests
- Non-root user in Docker for security

## Production Checklist

- [ ] Set `HOST` to your public HTTPS URL
- [ ] Configure HTTPS (via ALB, nginx, or similar)
- [ ] Adjust `FILE_TTL_MINUTES` as needed (5-10 recommended)
- [ ] Set up monitoring/logging (CloudWatch, DataDog, etc.)
- [ ] Configure auto-scaling for ECS
- [ ] Set up health check alarms
- [ ] Configure S3 for file storage (optional, for HA)
- [ ] Enable request logging

## Troubleshooting

### LibreOffice fails to convert
- Ensure LibreOffice is installed: `libreoffice --version`
- Check available memory (LibreOffice needs 1GB+)
- Verify fonts are installed

### OCR produces empty text
- Install language packs: `tesseract-ocr-[lang]`
- Check if input PDF has images (not text)

### ImageMagick PDF errors
- Update ImageMagick policy: Edit `/etc/ImageMagick-6/policy.xml`
- Change `rights="none" pattern="PDF"` to `rights="read|write" pattern="PDF"`

### Ghostscript errors
- Ensure Ghostscript is installed: `gs --version`
- Check for corrupted input PDFs
