# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum* ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Runtime stage - Use Debian for better LibreOffice support
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # LibreOffice for document conversions
    libreoffice \
    # Tesseract OCR with language packs
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-spa \
    tesseract-ocr-ita \
    tesseract-ocr-por \
    tesseract-ocr-hin \
    # OCRmyPDF for better PDF OCR
    ocrmypdf \
    # Ghostscript for PDF/A and image conversion
    ghostscript \
    # ImageMagick for image processing
    imagemagick \
    # Poppler utils for PDF text extraction
    poppler-utils \
    # wkhtmltopdf for HTML to PDF
    wkhtmltopdf \
    # Fonts for better document rendering
    fonts-liberation \
    fonts-dejavu-core \
    fonts-freefont-ttf \
    # CA certificates for HTTPS
    ca-certificates \
    # curl for healthcheck
    curl \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure ImageMagick policy to allow PDF operations
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml || true

# Copy binary from builder
COPY --from=builder /app/server .

# Create all necessary directories under /app
RUN mkdir -p /app/temp/uploads /app/temp/output /app/.config /app/.cache

# Environment - ALL paths must stay under /app
ENV PORT=8080
ENV HOST=http://localhost:8080
ENV TEMP_DIR=/app/temp
ENV FILE_TTL_MINUTES=10
# Prevent pdfcpu and other tools from writing to /home or /root
ENV HOME=/app
ENV XDG_CONFIG_HOME=/app/.config
ENV XDG_CACHE_HOME=/app/.cache
# LibreOffice user profile must stay under /app
ENV FONTCONFIG_PATH=/etc/fonts

# Non-root user for security - home directory set to /app
RUN useradd -r -s /bin/false -d /app pdfuser && \
    chown -R pdfuser:pdfuser /app
USER pdfuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./server"]
