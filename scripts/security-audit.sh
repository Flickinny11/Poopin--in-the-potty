#!/bin/bash

# =================================================================
# VidLiSync Security Audit Script
# =================================================================
# Comprehensive security testing for production deployment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIT_RESULTS_DIR="/tmp/vidlisync-security-audit-$(date +%Y%m%d-%H%M%S)"
BASE_URL="${BASE_URL:-https://vidlisync.com}"
API_URL="${API_URL:-https://vidlisync-backend.railway.app}"
AI_URL="${AI_URL:-https://ai.vidlisync.com}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Audit counters
SECURITY_ISSUES_FOUND=0
SECURITY_RECOMMENDATIONS=0
CRITICAL_ISSUES=0

# Create audit results directory
mkdir -p "$AUDIT_RESULTS_DIR"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$AUDIT_RESULTS_DIR/security-audit.log"
}

success() {
    echo -e "${GREEN}[SECURE]${NC} $1" | tee -a "$AUDIT_RESULTS_DIR/security-audit.log"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$AUDIT_RESULTS_DIR/security-audit.log"
    ((SECURITY_RECOMMENDATIONS++))
}

critical() {
    echo -e "${RED}[CRITICAL]${NC} $1" | tee -a "$AUDIT_RESULTS_DIR/security-audit.log"
    ((CRITICAL_ISSUES++))
    ((SECURITY_ISSUES_FOUND++))
}

issue() {
    echo -e "${RED}[ISSUE]${NC} $1" | tee -a "$AUDIT_RESULTS_DIR/security-audit.log"
    ((SECURITY_ISSUES_FOUND++))
}

# Security audit functions
audit_exposed_secrets() {
    log "🔍 Auditing for exposed secrets in codebase..."
    
    local project_root="$(dirname "$SCRIPT_DIR")"
    local secrets_found=false
    
    # Common secret patterns
    local secret_patterns=(
        "sk-[a-zA-Z0-9]{48,}"                    # OpenAI keys
        "sk_live_[a-zA-Z0-9]{99,}"               # Stripe live keys
        "sk_test_[a-zA-Z0-9]{99,}"               # Stripe test keys
        "AIza[a-zA-Z0-9_-]{35}"                  # Google API keys
        "AKIA[0-9A-Z]{16}"                       # AWS access keys
        "-----BEGIN PRIVATE KEY-----"            # Private keys
        "-----BEGIN RSA PRIVATE KEY-----"        # RSA private keys
        "eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\." # JWT tokens
        "[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"   # Credit card numbers
    )
    
    for pattern in "${secret_patterns[@]}"; do
        log "  Checking for pattern: ${pattern:0:20}..."
        
        if grep -rE "$pattern" "$project_root" \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            --exclude-dir=dist \
            --exclude-dir=build \
            --exclude="*.log" \
            --exclude="*security-audit*" \
            2>/dev/null; then
            
            critical "🚨 EXPOSED SECRET DETECTED: Pattern '$pattern' found in codebase!"
            secrets_found=true
        fi
    done
    
    if ! $secrets_found; then
        success "✅ No exposed secrets found in codebase"
    fi
    
    # Check .env files specifically
    if find "$project_root" -name "*.env" -not -path "*/node_modules/*" -not -name "*.example" | grep -q .; then
        warning "⚠️ .env files found - ensure they're not committed to version control"
        find "$project_root" -name "*.env" -not -path "*/node_modules/*" -not -name "*.example" >> "$AUDIT_RESULTS_DIR/env_files.txt"
    fi
}

audit_api_security() {
    log "🔒 Auditing API security..."
    
    # Test API endpoints for common vulnerabilities
    local api_endpoints=(
        "$API_URL/api/health"
        "$API_URL/api/users/me"
        "$API_URL/api/billing/subscription"
        "$BASE_URL/api/security/audit"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        log "  Testing endpoint: $endpoint"
        
        # Test without authentication
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
        
        if [ "$status" = "200" ]; then
            if [[ "$endpoint" == *"/me"* ]] || [[ "$endpoint" == *"/billing"* ]]; then
                issue "🔓 Protected endpoint accessible without authentication: $endpoint"
            else
                success "✅ Public endpoint accessible: $endpoint"
            fi
        elif [ "$status" = "401" ] || [ "$status" = "403" ]; then
            success "✅ Protected endpoint properly secured: $endpoint"
        else
            warning "⚠️ Endpoint returned unexpected status $status: $endpoint"
        fi
        
        # Test for SQL injection
        local sql_test_status=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint?id=1' OR '1'='1" 2>/dev/null || echo "000")
        if [ "$sql_test_status" = "500" ]; then
            critical "🚨 Possible SQL injection vulnerability: $endpoint"
        fi
        
        # Test for XSS
        local xss_test_status=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint?msg=<script>alert('xss')</script>" 2>/dev/null || echo "000")
        # XSS testing would require response content analysis, not just status codes
    done
}

audit_ssl_configuration() {
    log "🔐 Auditing SSL/TLS configuration..."
    
    local domains=("$BASE_URL" "$API_URL" "$AI_URL")
    
    for domain in "${domains[@]}"; do
        local hostname=$(echo "$domain" | sed 's/https\?:\/\///' | sed 's/\/.*//')
        log "  Testing SSL for: $hostname"
        
        # Test SSL certificate
        if command -v openssl >/dev/null 2>&1; then
            local ssl_output=$(echo | openssl s_client -servername "$hostname" -connect "$hostname:443" 2>/dev/null)
            
            if echo "$ssl_output" | grep -q "Verification: OK"; then
                success "✅ SSL certificate valid for $hostname"
            else
                issue "🔓 SSL certificate issues for $hostname"
            fi
            
            # Check certificate expiration
            local cert_expiry=$(echo "$ssl_output" | openssl x509 -noout -dates 2>/dev/null | grep "notAfter" | cut -d= -f2)
            if [ -n "$cert_expiry" ]; then
                local expiry_timestamp=$(date -d "$cert_expiry" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [ $days_until_expiry -lt 30 ]; then
                    warning "⚠️ SSL certificate expires soon for $hostname (${days_until_expiry} days)"
                else
                    success "✅ SSL certificate valid for $hostname (${days_until_expiry} days remaining)"
                fi
            fi
        else
            warning "⚠️ OpenSSL not available for SSL testing"
        fi
        
        # Test HTTPS redirect
        local http_url="http://$(echo "$domain" | sed 's/https\?:\/\///')"
        local redirect_status=$(curl -s -o /dev/null -w "%{http_code}" -L "$http_url" 2>/dev/null || echo "000")
        
        if [ "$redirect_status" = "200" ]; then
            local final_url=$(curl -s -o /dev/null -w "%{url_effective}" -L "$http_url" 2>/dev/null || echo "")
            if [[ "$final_url" == https://* ]]; then
                success "✅ HTTP to HTTPS redirect working for $hostname"
            else
                issue "🔓 HTTP not redirecting to HTTPS for $hostname"
            fi
        fi
    done
}

audit_security_headers() {
    log "🛡️ Auditing security headers..."
    
    local required_headers=(
        "Strict-Transport-Security"
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Content-Security-Policy"
    )
    
    local response_headers=$(curl -s -I "$BASE_URL" 2>/dev/null || echo "")
    
    for header in "${required_headers[@]}"; do
        if echo "$response_headers" | grep -qi "$header"; then
            success "✅ Security header present: $header"
        else
            warning "⚠️ Missing security header: $header"
        fi
    done
    
    # Check for information disclosure headers
    local disclosure_headers=(
        "Server"
        "X-Powered-By"
        "X-AspNet-Version"
    )
    
    for header in "${disclosure_headers[@]}"; do
        if echo "$response_headers" | grep -qi "$header"; then
            warning "⚠️ Information disclosure header present: $header"
        fi
    done
}

audit_cors_configuration() {
    log "🌐 Auditing CORS configuration..."
    
    # Test CORS headers
    local cors_response=$(curl -s -I -H "Origin: https://evil.com" "$API_URL/api/health" 2>/dev/null || echo "")
    
    if echo "$cors_response" | grep -qi "Access-Control-Allow-Origin: \*"; then
        critical "🚨 Wildcard CORS policy detected - potential security risk!"
    elif echo "$cors_response" | grep -qi "Access-Control-Allow-Origin:"; then
        success "✅ CORS headers configured"
    else
        warning "⚠️ No CORS headers detected"
    fi
}

audit_rate_limiting() {
    log "🚦 Auditing rate limiting..."
    
    local test_endpoint="$API_URL/api/health"
    local request_count=0
    local rate_limited=false
    
    # Send multiple requests to test rate limiting
    for i in {1..20}; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$test_endpoint" 2>/dev/null || echo "000")
        ((request_count++))
        
        if [ "$status" = "429" ]; then
            rate_limited=true
            break
        fi
        
        sleep 0.1
    done
    
    if $rate_limited; then
        success "✅ Rate limiting active (triggered after $request_count requests)"
    else
        warning "⚠️ No rate limiting detected after $request_count requests"
    fi
}

audit_input_validation() {
    log "🔍 Auditing input validation..."
    
    # Test various malicious inputs
    local malicious_inputs=(
        "../../../etc/passwd"
        "'; DROP TABLE users; --"
        "<script>alert('xss')</script>"
        "{{7*7}}"
        "\${7*7}"
    )
    
    local test_endpoint="$API_URL/api/health"
    
    for input in "${malicious_inputs[@]}"; do
        local encoded_input=$(printf '%s' "$input" | od -An -tx1 | tr ' ' '%' | sed 's/%/%/g')
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$test_endpoint?test=$encoded_input" 2>/dev/null || echo "000")
        
        if [ "$status" = "400" ] || [ "$status" = "422" ]; then
            success "✅ Input validation working for: ${input:0:20}..."
        elif [ "$status" = "500" ]; then
            critical "🚨 Server error with malicious input: ${input:0:20}..."
        fi
    done
}

audit_authentication_security() {
    log "🔐 Auditing authentication security..."
    
    # Test weak password policy
    local signup_endpoint="$API_URL/api/auth/signup"
    local weak_passwords=("123456" "password" "admin" "test")
    
    for password in "${weak_passwords[@]}"; do
        local response=$(curl -s -w "%{http_code}" -o /tmp/signup_test.json \
            -X POST "$signup_endpoint" \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"test$(date +%s)@example.com\",
                \"password\": \"$password\",
                \"fullName\": \"Test User\"
            }" 2>/dev/null || echo "000")
        
        if [ "$response" = "400" ] || [ "$response" = "422" ]; then
            success "✅ Weak password rejected: $password"
        elif [ "$response" = "200" ] || [ "$response" = "201" ]; then
            warning "⚠️ Weak password accepted: $password"
        fi
    done
    
    # Test for default credentials
    local login_endpoint="$API_URL/api/auth/login"
    local default_creds=(
        "admin:admin"
        "admin:password"
        "root:root"
        "test@example.com:password"
    )
    
    for cred in "${default_creds[@]}"; do
        local email="${cred%:*}"
        local password="${cred#*:}"
        
        local response=$(curl -s -w "%{http_code}" -o /tmp/login_test.json \
            -X POST "$login_endpoint" \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"$email\",
                \"password\": \"$password\"
            }" 2>/dev/null || echo "000")
        
        if [ "$response" = "200" ]; then
            critical "🚨 Default credentials active: $email"
        fi
    done
}

generate_security_report() {
    log "📋 Generating security audit report..."
    
    local report_file="$AUDIT_RESULTS_DIR/security_report.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>VidLiSync Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .metric { text-align: center; padding: 20px; border-radius: 5px; }
        .metric.good { background: #d4edda; border: 1px solid #c3e6cb; }
        .metric.warning { background: #fff3cd; border: 1px solid #ffeaa7; }
        .metric.critical { background: #f8d7da; border: 1px solid #f5c6cb; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .issue { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .success { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 VidLiSync Security Audit Report</h1>
        <p>Generated on: $(date)</p>
        <p>Audit Environment: Production</p>
    </div>
    
    <div class="summary">
        <div class="metric $([ $CRITICAL_ISSUES -eq 0 ] && echo "good" || echo "critical")">
            <h3>$CRITICAL_ISSUES</h3>
            <p>Critical Issues</p>
        </div>
        <div class="metric $([ $SECURITY_ISSUES_FOUND -eq 0 ] && echo "good" || echo "warning")">
            <h3>$SECURITY_ISSUES_FOUND</h3>
            <p>Security Issues</p>
        </div>
        <div class="metric $([ $SECURITY_RECOMMENDATIONS -eq 0 ] && echo "good" || echo "warning")">
            <h3>$SECURITY_RECOMMENDATIONS</h3>
            <p>Recommendations</p>
        </div>
    </div>
    
    <div class="section">
        <h2>🔍 Audit Scope</h2>
        <ul>
            <li>Exposed secrets detection</li>
            <li>API security testing</li>
            <li>SSL/TLS configuration</li>
            <li>Security headers analysis</li>
            <li>CORS policy review</li>
            <li>Rate limiting verification</li>
            <li>Input validation testing</li>
            <li>Authentication security</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>📊 Findings Summary</h2>
        $(if [ $CRITICAL_ISSUES -eq 0 ] && [ $SECURITY_ISSUES_FOUND -eq 0 ]; then
            echo '<p class="success">✅ No critical security issues found!</p>'
        else
            echo '<p class="issue">❌ Security issues require attention</p>'
        fi)
        
        <p>Full audit details available in: <code>$AUDIT_RESULTS_DIR/security-audit.log</code></p>
    </div>
    
    <div class="section">
        <h2>🛠️ Recommendations</h2>
        <ul>
            <li>Review and rotate any exposed API keys immediately</li>
            <li>Implement missing security headers</li>
            <li>Configure proper CORS policies</li>
            <li>Enable rate limiting on all endpoints</li>
            <li>Regular security audits and penetration testing</li>
            <li>Security awareness training for development team</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    success "Security audit report generated: $report_file"
}

# Main execution
main() {
    log "🔒 Starting VidLiSync Security Audit..."
    
    # Run security audits
    audit_exposed_secrets
    audit_api_security
    audit_ssl_configuration
    audit_security_headers
    audit_cors_configuration
    audit_rate_limiting
    audit_input_validation
    audit_authentication_security
    
    # Generate comprehensive report
    generate_security_report
    
    # Final security assessment
    log "🔍 Security Audit Summary:"
    
    if [ $CRITICAL_ISSUES -eq 0 ] && [ $SECURITY_ISSUES_FOUND -eq 0 ]; then
        success "🎉 Security audit passed! No critical issues found."
        log "📁 Audit results saved to: $AUDIT_RESULTS_DIR"
        return 0
    else
        critical "❌ Security audit found $CRITICAL_ISSUES critical issues and $SECURITY_ISSUES_FOUND total issues"
        log "📁 Detailed results and recommendations saved to: $AUDIT_RESULTS_DIR"
        return 1
    fi
}

# Execute main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi