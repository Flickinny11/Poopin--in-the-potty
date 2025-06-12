#!/bin/bash

# =================================================================
# VidLiSync Performance Testing Script
# =================================================================
# Tests translation latency and system performance under load

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="/tmp/vidlisync-performance-$(date +%Y%m%d-%H%M%S)"
API_URL="${API_URL:-https://vidlisync-backend.railway.app}"
AI_URL="${AI_URL:-https://ai.vidlisync.com}"
TEST_ITERATIONS="${TEST_ITERATIONS:-100}"
CONCURRENT_USERS="${CONCURRENT_USERS:-10}"
LATENCY_TARGET="${LATENCY_TARGET:-400}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create results directory
mkdir -p "$RESULTS_DIR"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$RESULTS_DIR/performance.log"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$RESULTS_DIR/performance.log"
}

failure() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$RESULTS_DIR/performance.log"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$RESULTS_DIR/performance.log"
}

# Performance test functions
test_translation_latency() {
    log "Testing translation latency ($TEST_ITERATIONS iterations)..."
    
    local latencies=()
    local success_count=0
    local failure_count=0
    
    for i in $(seq 1 $TEST_ITERATIONS); do
        local start_time=$(date +%s%3N)
        
        # Test translation API
        local response=$(curl -s -w "%{http_code}" -o /tmp/translation_response.json \
            -X POST "$AI_URL/api/translation/translate" \
            -H "Content-Type: application/json" \
            -d '{
                "text": "Hello, how are you today?",
                "target_language": "es",
                "source_language": "en"
            }' 2>/dev/null || echo "000")
        
        local end_time=$(date +%s%3N)
        local latency=$((end_time - start_time))
        
        if [ "$response" = "200" ]; then
            latencies+=($latency)
            ((success_count++))
            if [ $((i % 10)) -eq 0 ]; then
                log "Completed $i/$TEST_ITERATIONS translations (${latency}ms)"
            fi
        else
            ((failure_count++))
            warning "Translation failed (iteration $i): HTTP $response"
        fi
    done
    
    # Calculate statistics
    if [ ${#latencies[@]} -gt 0 ]; then
        local total=0
        for latency in "${latencies[@]}"; do
            total=$((total + latency))
        done
        
        local avg_latency=$((total / ${#latencies[@]}))
        
        # Sort latencies for percentile calculation
        IFS=$'\n' sorted_latencies=($(sort -n <<<"${latencies[*]}"))
        local median_index=$((${#sorted_latencies[@]} / 2))
        local p95_index=$((${#sorted_latencies[@]} * 95 / 100))
        local p99_index=$((${#sorted_latencies[@]} * 99 / 100))
        
        local median_latency=${sorted_latencies[$median_index]}
        local p95_latency=${sorted_latencies[$p95_index]}
        local p99_latency=${sorted_latencies[$p99_index]}
        local min_latency=${sorted_latencies[0]}
        local max_latency=${sorted_latencies[-1]}
        
        # Generate performance report
        cat > "$RESULTS_DIR/translation_performance.json" << EOF
{
    "test_config": {
        "iterations": $TEST_ITERATIONS,
        "target_latency_ms": $LATENCY_TARGET,
        "timestamp": "$(date -Iseconds)"
    },
    "results": {
        "success_count": $success_count,
        "failure_count": $failure_count,
        "success_rate": $(bc -l <<< "scale=2; $success_count * 100 / $TEST_ITERATIONS"),
        "latency_stats": {
            "min_ms": $min_latency,
            "max_ms": $max_latency,
            "avg_ms": $avg_latency,
            "median_ms": $median_latency,
            "p95_ms": $p95_latency,
            "p99_ms": $p99_latency
        },
        "performance_targets": {
            "meets_avg_target": $([ $avg_latency -lt $LATENCY_TARGET ] && echo "true" || echo "false"),
            "meets_p95_target": $([ $p95_latency -lt $LATENCY_TARGET ] && echo "true" || echo "false"),
            "meets_p99_target": $([ $p99_latency -lt $LATENCY_TARGET ] && echo "true" || echo "false")
        }
    }
}
EOF
        
        log "Translation Performance Results:"
        log "  Successful translations: $success_count/$TEST_ITERATIONS ($(bc -l <<< "scale=1; $success_count * 100 / $TEST_ITERATIONS")%)"
        log "  Average latency: ${avg_latency}ms"
        log "  Median latency: ${median_latency}ms"
        log "  95th percentile: ${p95_latency}ms"
        log "  99th percentile: ${p99_latency}ms"
        log "  Min/Max: ${min_latency}ms / ${max_latency}ms"
        
        # Check performance targets
        if [ $p95_latency -lt $LATENCY_TARGET ]; then
            success "✅ 95th percentile latency meets target (<${LATENCY_TARGET}ms)"
        else
            failure "❌ 95th percentile latency exceeds target (${p95_latency}ms > ${LATENCY_TARGET}ms)"
        fi
        
        return $([ $p95_latency -lt $LATENCY_TARGET ] && echo 0 || echo 1)
    else
        failure "❌ No successful translations completed"
        return 1
    fi
}

test_concurrent_load() {
    log "Testing concurrent load ($CONCURRENT_USERS users)..."
    
    local pids=()
    local start_time=$(date +%s)
    
    # Start concurrent translation requests
    for i in $(seq 1 $CONCURRENT_USERS); do
        (
            local user_start=$(date +%s%3N)
            local response=$(curl -s -w "%{http_code}" -o "/tmp/concurrent_${i}.json" \
                -X POST "$AI_URL/api/translation/translate" \
                -H "Content-Type: application/json" \
                -d "{
                    \"text\": \"This is test message number $i for concurrent testing\",
                    \"target_language\": \"fr\",
                    \"source_language\": \"en\"
                }" 2>/dev/null || echo "000")
            
            local user_end=$(date +%s%3N)
            local user_latency=$((user_end - user_start))
            
            echo "$i,$response,$user_latency" >> "$RESULTS_DIR/concurrent_results.csv"
        ) &
        pids+=($!)
    done
    
    # Wait for all requests to complete
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    # Analyze concurrent results
    local successful_requests=0
    local failed_requests=0
    local total_latency=0
    
    if [ -f "$RESULTS_DIR/concurrent_results.csv" ]; then
        while IFS=',' read -r user_id status_code latency; do
            if [ "$status_code" = "200" ]; then
                ((successful_requests++))
                total_latency=$((total_latency + latency))
            else
                ((failed_requests++))
            fi
        done < "$RESULTS_DIR/concurrent_results.csv"
        
        if [ $successful_requests -gt 0 ]; then
            local avg_concurrent_latency=$((total_latency / successful_requests))
            
            log "Concurrent Load Results:"
            log "  Total time: ${total_time}s"
            log "  Successful requests: $successful_requests/$CONCURRENT_USERS"
            log "  Failed requests: $failed_requests"
            log "  Average latency: ${avg_concurrent_latency}ms"
            
            # Check if system handles concurrent load well
            if [ $successful_requests -eq $CONCURRENT_USERS ] && [ $avg_concurrent_latency -lt $((LATENCY_TARGET * 2)) ]; then
                success "✅ System handles concurrent load well"
                return 0
            else
                warning "⚠️ System shows degradation under concurrent load"
                return 1
            fi
        else
            failure "❌ No successful concurrent requests"
            return 1
        fi
    else
        failure "❌ No concurrent test results found"
        return 1
    fi
}

test_memory_usage() {
    log "Testing memory usage patterns..."
    
    # Simulate memory-intensive operations
    local initial_memory=$(free -m | awk 'NR==2{print $3}')
    
    # Run multiple translation requests to test memory usage
    for i in $(seq 1 20); do
        curl -s -o /dev/null \
            -X POST "$AI_URL/api/translation/translate" \
            -H "Content-Type: application/json" \
            -d '{
                "text": "This is a longer text for memory testing. We want to ensure that memory usage remains stable even with repeated requests and does not show memory leaks.",
                "target_language": "de",
                "source_language": "en"
            }' 2>/dev/null || true
    done
    
    local final_memory=$(free -m | awk 'NR==2{print $3}')
    local memory_diff=$((final_memory - initial_memory))
    
    log "Memory Usage Test:"
    log "  Initial memory: ${initial_memory}MB"
    log "  Final memory: ${final_memory}MB"
    log "  Memory difference: ${memory_diff}MB"
    
    # Memory usage should be reasonable (< 100MB increase for 20 requests)
    if [ $memory_diff -lt 100 ]; then
        success "✅ Memory usage remains stable"
        return 0
    else
        warning "⚠️ Memory usage increased significantly (${memory_diff}MB)"
        return 1
    fi
}

test_system_health() {
    log "Testing system health endpoints..."
    
    # Test health endpoints
    local health_tests=(
        "Frontend:$API_URL/health"
        "AI Service:$AI_URL/health"
        "Translation:$AI_URL/api/translation/health"
    )
    
    local all_healthy=true
    
    for test in "${health_tests[@]}"; do
        local name="${test%:*}"
        local url="${test#*:}"
        
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [ "$status" = "200" ]; then
            success "✅ $name health check passed"
        else
            failure "❌ $name health check failed (HTTP $status)"
            all_healthy=false
        fi
    done
    
    $all_healthy
}

generate_performance_report() {
    log "Generating comprehensive performance report..."
    
    local report_file="$RESULTS_DIR/performance_report.html"
    
    cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>VidLiSync Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border-radius: 5px; text-align: center; }
        .metric.good { background: #d4edda; border: 1px solid #c3e6cb; }
        .metric.warning { background: #fff3cd; border: 1px solid #ffeaa7; }
        .metric.bad { background: #f8d7da; border: 1px solid #f5c6cb; }
        .results { margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 VidLiSync Performance Test Report</h1>
        <p>Generated on: <span id="timestamp"></span></p>
        <p>Test Environment: <span id="environment"></span></p>
    </div>
    
    <div class="results">
        <h2>📊 Performance Metrics</h2>
        <div id="metrics-container"></div>
        
        <h2>📈 Translation Latency Analysis</h2>
        <div id="latency-results"></div>
        
        <h2>⚡ Concurrent Load Test</h2>
        <div id="load-results"></div>
        
        <h2>💾 Memory Usage</h2>
        <div id="memory-results"></div>
        
        <h2>❤️ System Health</h2>
        <div id="health-results"></div>
    </div>
    
    <script>
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        document.getElementById('environment').textContent = window.location.hostname;
        
        // Load and display results from JSON files
        // This would be populated by the test results
    </script>
</body>
</html>
EOF
    
    success "Performance report generated: $report_file"
}

# Main execution
main() {
    log "🚀 Starting VidLiSync Performance Tests..."
    
    local overall_success=true
    
    # Create CSV headers
    echo "test_name,status,details" > "$RESULTS_DIR/test_summary.csv"
    
    # Run performance tests
    if test_system_health; then
        echo "system_health,PASS,All health checks passed" >> "$RESULTS_DIR/test_summary.csv"
    else
        echo "system_health,FAIL,Some health checks failed" >> "$RESULTS_DIR/test_summary.csv"
        overall_success=false
    fi
    
    if test_translation_latency; then
        echo "translation_latency,PASS,Latency meets target" >> "$RESULTS_DIR/test_summary.csv"
    else
        echo "translation_latency,FAIL,Latency exceeds target" >> "$RESULTS_DIR/test_summary.csv"
        overall_success=false
    fi
    
    if test_concurrent_load; then
        echo "concurrent_load,PASS,System handles concurrent users" >> "$RESULTS_DIR/test_summary.csv"
    else
        echo "concurrent_load,FAIL,System struggles with concurrent load" >> "$RESULTS_DIR/test_summary.csv"
        overall_success=false
    fi
    
    if test_memory_usage; then
        echo "memory_usage,PASS,Memory usage is stable" >> "$RESULTS_DIR/test_summary.csv"
    else
        echo "memory_usage,FAIL,Memory usage shows issues" >> "$RESULTS_DIR/test_summary.csv"
        overall_success=false
    fi
    
    # Generate report
    generate_performance_report
    
    # Final summary
    log "📋 Performance Test Summary:"
    if $overall_success; then
        success "🎉 All performance tests passed!"
        log "📁 Results saved to: $RESULTS_DIR"
        return 0
    else
        failure "❌ Some performance tests failed"
        log "📁 Results and logs saved to: $RESULTS_DIR"
        return 1
    fi
}

# Execute main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi