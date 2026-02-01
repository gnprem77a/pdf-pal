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

# Runtime stage
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

# Copy binary
COPY --from=builder /app/server .

# Create temp directories
RUN mkdir -p /app/temp/uploads /app/temp/output

# Environment
ENV PORT=8080
ENV TEMP_DIR=/app/temp
ENV FILE_TTL_MINUTES=10

EXPOSE 8080

CMD ["./server"]
