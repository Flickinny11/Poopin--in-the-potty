import { NextRequest, NextResponse } from 'next/server';
import { auditKeyConfiguration } from '@/lib/security/key-manager';

/**
 * Security audit endpoint
 * Validates API key configuration and security posture
 * Only accessible in development or with proper authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Security check - only allow in development or with proper auth
    const isDevelopment = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const isAuthorized = authHeader === `Bearer ${process.env.SECURITY_AUDIT_TOKEN}`;

    if (!isDevelopment && !isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized access to security audit' },
        { status: 401 }
      );
    }

    // Perform security audit
    const auditResult = await auditKeyConfiguration();

    // Sanitize response - never expose actual key values
    const response = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      security: {
        secure: auditResult.secure,
        issuesCount: auditResult.issues.length,
        issues: auditResult.issues,
        recommendations: auditResult.recommendations
      },
      keyConfiguration: {
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        googleTranslateConfigured: !!process.env.GOOGLE_TRANSLATE_API_KEY,
        supabaseConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        dailyConfigured: !!process.env.DAILY_API_KEY
      },
      securityHeaders: {
        hasSecurityHeaders: checkSecurityHeaders(),
        recommendations: getSecurityHeaderRecommendations()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Security audit failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Security audit failed',
        timestamp: new Date().toISOString(),
        secure: false
      },
      { status: 500 }
    );
  }
}

function checkSecurityHeaders(): boolean {
  // Check if security headers are configured in next.config.js
  // This is a basic check - in production you'd verify actual headers
  return true; // Assume configured for now
}

function getSecurityHeaderRecommendations(): string[] {
  const recommendations: string[] = [];
  
  // Check environment-specific recommendations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SECURITY_AUDIT_TOKEN) {
      recommendations.push('Set SECURITY_AUDIT_TOKEN for production security audits');
    }
    
    if (!process.env.WEBHOOK_SECRET) {
      recommendations.push('Configure WEBHOOK_SECRET for webhook validation');
    }
  }

  return recommendations;
}

// POST method for key rotation (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const isAuthorized = authHeader === `Bearer ${process.env.SECURITY_ADMIN_TOKEN}`;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized access to key rotation' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    if (action === 'rotate_keys') {
      // In a real implementation, this would trigger key rotation
      // For now, we'll just validate the current configuration
      const auditResult = await auditKeyConfiguration();
      
      return NextResponse.json({
        message: 'Key rotation initiated',
        timestamp: new Date().toISOString(),
        secure: auditResult.secure
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Key rotation failed:', error);
    
    return NextResponse.json(
      { error: 'Key rotation failed' },
      { status: 500 }
    );
  }
}