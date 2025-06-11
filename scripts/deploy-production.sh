#!/bin/bash

# =================================================================
# VidLiSync Production Deployment Script
# =================================================================
# This script handles the complete production deployment process
# with health checks, rollback capabilities, and monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/vidlisync-deploy.log"
DEPLOYMENT_ID=$(date +%Y%m%d-%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Health check function
health_check() {
    local url=$1
    local name=$2
    local timeout=${3:-30}
    
    log "Checking health of $name at $url"
    
    if curl -f --max-time "$timeout" --silent "$url" > /dev/null; then
        success "$name is healthy"
        return 0
    else
        error "$name health check failed"
        return 1
    fi
}

# Rollback function
rollback() {
    local component=$1
    warning "Rolling back $component..."
    
    case $component in
        "frontend")
            log "Rolling back frontend on Vercel..."
            vercel rollback --token="$VERCEL_TOKEN" || true
            ;;
        "backend")
            log "Rolling back backend on Railway..."
            npx @railway/cli rollback --service backend --environment production || true
            ;;
        "ai")
            log "Rolling back AI service on RunPod..."
            kubectl rollout undo deployment/vidlisync-ai || true
            ;;
        "all")
            rollback "frontend"
            rollback "backend"
            rollback "ai"
            ;;
    esac
}

# Cleanup on exit
cleanup() {
    if [ $? -ne 0 ]; then
        error "Deployment failed! Check logs at $LOG_FILE"
        
        if [ "${AUTO_ROLLBACK:-true}" = "true" ]; then
            warning "Auto-rollback is enabled, rolling back all components..."
            rollback "all"
        fi
    fi
}

trap cleanup EXIT

# Main deployment function
deploy() {
    log "🚀 Starting VidLiSync production deployment - ID: $DEPLOYMENT_ID"
    
    # Pre-deployment checks
    log "Running pre-deployment checks..."
    
    # Check required environment variables
    required_vars=(
        "VERCEL_TOKEN"
        "RAILWAY_TOKEN"
        "DATABASE_URL"
        "NEXT_PUBLIC_SUPABASE_URL"
        "STRIPE_SECRET_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    success "Environment variables validated"
    
    # Run database migrations
    log "Running database migrations..."
    cd "$PROJECT_ROOT/backend"
    
    # Backup database before migration
    if [ "${SKIP_DB_BACKUP:-false}" = "false" ]; then
        log "Creating database backup..."
        pg_dump "$DATABASE_URL" > "/tmp/db_backup_$DEPLOYMENT_ID.sql"
        success "Database backup created"
    fi
    
    # Run migrations
    alembic upgrade head
    success "Database migrations completed"
    
    # Deploy backend to Railway
    log "Deploying backend to Railway..."
    npx @railway/cli deploy --service backend --environment production
    
    # Wait for backend deployment
    sleep 30
    
    # Health check backend
    if ! health_check "https://vidlisync-backend.railway.app/health" "Backend API" 60; then
        error "Backend deployment failed health check"
        rollback "backend"
        exit 1
    fi
    
    # Deploy AI service to RunPod
    log "Deploying AI service to RunPod..."
    kubectl apply -f "$PROJECT_ROOT/deployment/runpod-ai-service.yaml"
    
    # Wait for AI service deployment
    kubectl rollout status deployment/vidlisync-ai --timeout=300s
    
    # Health check AI service
    if ! health_check "https://ai.vidlisync.com/health" "AI Service" 60; then
        error "AI service deployment failed health check"
        rollback "ai"
        exit 1
    fi
    
    # Deploy frontend to Vercel
    log "Deploying frontend to Vercel..."
    cd "$PROJECT_ROOT"
    
    vercel deploy --prod \
        --token="$VERCEL_TOKEN" \
        --env NODE_ENV=production \
        --env NEXT_PUBLIC_APP_URL=https://vidlisync.com \
        --env NEXT_PUBLIC_API_URL=https://vidlisync-backend.railway.app
    
    # Wait for frontend deployment
    sleep 30
    
    # Health check frontend
    if ! health_check "https://vidlisync.com" "Frontend" 60; then
        error "Frontend deployment failed health check"
        rollback "frontend"
        exit 1
    fi
    
    # Run post-deployment tests
    log "Running post-deployment tests..."
    
    # Test critical user flows
    if ! curl -f --max-time 30 "https://vidlisync.com/api/health" > /dev/null; then
        error "Frontend API health check failed"
        rollback "all"
        exit 1
    fi
    
    # Test backend API endpoints
    if ! curl -f --max-time 30 "https://vidlisync-backend.railway.app/api/users/health" > /dev/null; then
        error "Backend user API health check failed"
        rollback "all"
        exit 1
    fi
    
    # Test AI service
    if ! curl -f --max-time 30 "https://ai.vidlisync.com/api/translation/health" > /dev/null; then
        error "AI service health check failed"
        rollback "all"
        exit 1
    fi
    
    # Send deployment notification
    log "Sending deployment notifications..."
    
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 VidLiSync production deployment $DEPLOYMENT_ID completed successfully!\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    if [ -n "${DATADOG_API_KEY:-}" ]; then
        curl -X POST "https://api.datadoghq.com/api/v1/events" \
            -H "Content-Type: application/json" \
            -H "DD-API-KEY: $DATADOG_API_KEY" \
            -d "{
                \"title\": \"VidLiSync Production Deployment\",
                \"text\": \"Deployment $DEPLOYMENT_ID completed successfully\",
                \"priority\": \"normal\",
                \"tags\": [\"deployment\", \"production\", \"vidlisync\"]
            }" || true
    fi
    
    success "🎉 VidLiSync production deployment completed successfully!"
    success "Deployment ID: $DEPLOYMENT_ID"
    success "Frontend: https://vidlisync.com"
    success "Backend: https://vidlisync-backend.railway.app"
    success "AI Service: https://ai.vidlisync.com"
    
    log "Deployment logs saved to: $LOG_FILE"
}

# Script options
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        component="${2:-all}"
        rollback "$component"
        ;;
    "health-check")
        log "Running health checks..."
        health_check "https://vidlisync.com" "Frontend"
        health_check "https://vidlisync-backend.railway.app/health" "Backend"
        health_check "https://ai.vidlisync.com/health" "AI Service"
        success "All health checks passed"
        ;;
    "migration")
        log "Running database migrations only..."
        cd "$PROJECT_ROOT/backend"
        alembic upgrade head
        success "Database migrations completed"
        ;;
    *)
        echo "Usage: $0 {deploy|rollback [component]|health-check|migration}"
        echo "  deploy      - Full production deployment"
        echo "  rollback    - Rollback deployment (all|frontend|backend|ai)"
        echo "  health-check - Check health of all services"
        echo "  migration   - Run database migrations only"
        exit 1
        ;;
esac