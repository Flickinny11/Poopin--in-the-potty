# =================================================================
# VidLiSync Production Infrastructure - Terraform Configuration
# =================================================================
# Infrastructure as Code for complete VidLiSync production deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15"
    }
    railway = {
      source  = "railwayapp/railway"
      version = "~> 0.2"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.0"
    }
  }
  
  backend "s3" {
    bucket = "vidlisync-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

# =================================================================
# VARIABLES
# =================================================================

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "vidlisync.com"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "vidlisync"
}

variable "vercel_team_id" {
  description = "Vercel team ID"
  type        = string
  sensitive   = true
}

variable "railway_project_id" {
  description = "Railway project ID"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
  sensitive   = true
}

# =================================================================
# CLOUDFLARE CONFIGURATION
# =================================================================

resource "cloudflare_zone_settings_override" "vidlisync_settings" {
  zone_id = var.cloudflare_zone_id
  settings {
    ssl                      = "strict"
    always_https            = "on"
    min_tls_version         = "1.2"
    opportunistic_encryption = "on"
    tls_1_3                 = "zrt"
    automatic_https_rewrites = "on"
    security_level          = "medium"
    browser_check           = "on"
    challenge_ttl           = 1800
    privacy_pass            = "on"
    security_header {
      enabled = true
    }
  }
}

# DNS Records
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain_name
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = var.domain_name
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = "railway.app"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "ai" {
  zone_id = var.cloudflare_zone_id
  name    = "ai"
  value   = "runpod.io"
  type    = "CNAME"
  proxied = true
}

# WAF Rules
resource "cloudflare_ruleset" "waf_custom_rules" {
  zone_id = var.cloudflare_zone_id
  name    = "VidLiSync WAF Rules"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules {
    action = "challenge"
    expression = "(http.request.uri.path contains \"/admin\" and not ip.src in {192.168.1.0/24})"
    description = "Challenge admin access from non-office IPs"
  }

  rules {
    action = "block"
    expression = "(http.request.method eq \"POST\" and http.request.uri.path eq \"/api/webhooks\" and not http.request.headers[\"user-agent\"] contains \"Stripe\")"
    description = "Block non-Stripe webhook requests"
  }

  rules {
    action = "js_challenge"
    expression = "(cf.threat_score gt 14)"
    description = "JS challenge for suspicious traffic"
  }
}

# Rate Limiting
resource "cloudflare_rate_limit" "api_rate_limit" {
  zone_id   = var.cloudflare_zone_id
  threshold = 100
  period    = 60
  match {
    request {
      url_pattern = "${var.domain_name}/api/*"
      schemes     = ["HTTP", "HTTPS"]
      methods     = ["GET", "POST", "PUT", "DELETE"]
    }
  }
  action {
    mode    = "challenge"
    timeout = 86400
  }
}

# =================================================================
# VERCEL CONFIGURATION
# =================================================================

resource "vercel_project" "vidlisync_frontend" {
  name      = var.project_name
  framework = "nextjs"
  team_id   = var.vercel_team_id
  
  git_repository = {
    type = "github"
    repo = "Flickinny11/Poopin--in-the-potty"
  }

  environment = [
    {
      key    = "NODE_ENV"
      value  = "production"
      target = ["production"]
    },
    {
      key    = "NEXT_PUBLIC_APP_URL"
      value  = "https://${var.domain_name}"
      target = ["production"]
    },
    {
      key    = "NEXT_PUBLIC_API_URL"
      value  = "https://api.${var.domain_name}"
      target = ["production"]
    },
    {
      key    = "NEXT_PUBLIC_AI_API_URL"
      value  = "https://ai.${var.domain_name}"
      target = ["production"]
    }
  ]
}

resource "vercel_project_domain" "vidlisync_domain" {
  project_id = vercel_project.vidlisync_frontend.id
  domain     = var.domain_name
  team_id    = var.vercel_team_id
}

resource "vercel_project_domain" "vidlisync_www" {
  project_id = vercel_project.vidlisync_frontend.id
  domain     = "www.${var.domain_name}"
  team_id    = var.vercel_team_id
}

# =================================================================
# RAILWAY CONFIGURATION
# =================================================================

resource "railway_project" "vidlisync_backend" {
  name = "${var.project_name}-backend"
}

resource "railway_service" "backend_api" {
  project_id = railway_project.vidlisync_backend.id
  name       = "backend-api"
  
  source = {
    repo = "Flickinny11/Poopin--in-the-potty"
    branch = "main"
    build_command = "cd backend && pip install -r requirements.txt"
    start_command = "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
  }
}

resource "railway_variable" "backend_environment" {
  for_each = {
    "ENVIRONMENT"                = "production"
    "PORT"                      = "8000"
    "HOST"                      = "0.0.0.0"
    "WORKERS"                   = "4"
    "LOG_LEVEL"                 = "INFO"
    "ENABLE_RATE_LIMITING"      = "true"
    "MAX_REQUESTS_PER_MINUTE"   = "100"
    "DATABASE_POOL_SIZE"        = "20"
    "DATABASE_MAX_OVERFLOW"     = "5"
    "CORS_ORIGINS"              = "https://${var.domain_name},https://www.${var.domain_name}"
  }
  
  project_id = railway_project.vidlisync_backend.id
  name       = each.key
  value      = each.value
}

# =================================================================
# DATADOG MONITORING
# =================================================================

resource "datadog_dashboard" "vidlisync_dashboard" {
  title       = "VidLiSync Production Dashboard"
  description = "Comprehensive monitoring for VidLiSync production environment"
  layout_type = "ordered"

  widget {
    query_value_definition {
      request {
        q = "avg:system.cpu.user{service:vidlisync}"
        aggregator = "avg"
      }
      title = "CPU Usage"
      precision = 2
    }
  }

  widget {
    timeseries_definition {
      request {
        q = "avg:http.request.duration{service:vidlisync-backend} by {endpoint}"
        display_type = "line"
      }
      title = "API Response Times"
    }
  }

  widget {
    query_value_definition {
      request {
        q = "sum:vidlisync.active_users{*}"
        aggregator = "last"
      }
      title = "Active Users"
    }
  }
}

resource "datadog_monitor" "high_error_rate" {
  name    = "VidLiSync High Error Rate"
  type    = "metric alert"
  message = "Error rate is above threshold for VidLiSync"
  
  query = "avg(last_5m):sum:http.request.errors{service:vidlisync-backend}.as_rate() > 0.05"
  
  thresholds = {
    critical = 0.05
    warning  = 0.03
  }
  
  notify_audit        = false
  timeout_h          = 0
  include_tags       = true
  no_data_timeframe  = 10
  require_full_window = false
  
  tags = ["service:vidlisync", "environment:production"]
}

resource "datadog_monitor" "service_down" {
  name    = "VidLiSync Service Down"
  type    = "service check"
  message = "VidLiSync service is down"
  
  query = "\"http.can_connect\".over(\"service:vidlisync-backend\").last(2).count_by_status()"
  
  thresholds = {
    critical = 1
    ok       = 1
  }
  
  notify_audit        = false
  timeout_h          = 0
  include_tags       = true
  no_data_timeframe  = 2
  
  tags = ["service:vidlisync", "environment:production"]
}

# =================================================================
# SECRETS MANAGEMENT
# =================================================================

resource "vercel_project_environment_variable" "supabase_url" {
  project_id = vercel_project.vidlisync_frontend.id
  key        = "NEXT_PUBLIC_SUPABASE_URL"
  value      = var.supabase_url
  target     = ["production"]
  type       = "encrypted"
}

resource "vercel_project_environment_variable" "supabase_anon_key" {
  project_id = vercel_project.vidlisync_frontend.id
  key        = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  value      = var.supabase_anon_key
  target     = ["production"]
  type       = "encrypted"
}

resource "vercel_project_environment_variable" "stripe_publishable_key" {
  project_id = vercel_project.vidlisync_frontend.id
  key        = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  value      = var.stripe_publishable_key
  target     = ["production"]
  type       = "encrypted"
}

# =================================================================
# OUTPUTS
# =================================================================

output "frontend_url" {
  description = "Frontend application URL"
  value       = "https://${var.domain_name}"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "https://api.${var.domain_name}"
}

output "ai_service_url" {
  description = "AI service URL"
  value       = "https://ai.${var.domain_name}"
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  value       = var.cloudflare_zone_id
  sensitive   = true
}

output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.vidlisync_frontend.id
}

output "railway_project_id" {
  description = "Railway project ID"
  value       = railway_project.vidlisync_backend.id
}

# =================================================================
# SENSITIVE VARIABLES (should be set via environment or tfvars)
# =================================================================

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  sensitive   = true
}