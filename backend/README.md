# PDF Processing Backend

A Go-based PDF processing API that handles all PDF operations server-side.

## Quick Start

```bash
# Install dependencies
go mod tidy

# Run the server
go run .

# Server starts on http://localhost:8080
```

## Configuration

Environment variables:

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
| `/api/security/protect` | POST | `file0`, `password` |

### Other

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/files/{filename}` | GET | Download processed files |

## Docker

```bash
# Build
docker build -t pdf-backend .

# Run
docker run -p 8080:8080 \
  -e HOST=https://api.yourdomain.com \
  -e FILE_TTL_MINUTES=5 \
  pdf-backend
```

## AWS Deployment

### EC2

1. Build the Docker image
2. Push to ECR
3. Deploy on EC2 with Docker
4. Configure ALB for HTTPS
5. Set `HOST` to your domain

### Lambda + API Gateway

For serverless deployment, consider using AWS Lambda with API Gateway. You'll need to:
1. Modify the handler signatures for Lambda
2. Use S3 for file storage instead of local temp
3. Set appropriate timeout (15min max)

## Privacy & Security

- All uploaded files are deleted automatically after `FILE_TTL_MINUTES`
- Background cleanup runs every minute
- No user data is persisted
- CORS is configured for cross-origin requests

## Production Checklist

- [ ] Set `HOST` to your public HTTPS URL
- [ ] Configure HTTPS (via ALB, nginx, or similar)
- [ ] Adjust `FILE_TTL_MINUTES` as needed
- [ ] Set up monitoring/logging
- [ ] Consider S3 for file storage in serverless setup
