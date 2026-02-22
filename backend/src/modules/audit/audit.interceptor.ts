import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, user, ip, headers } = request;

        const isAuthEndpoint = url.includes('/auth');
        const isGet = method === 'GET';
        const shouldLogGet = isGet && this.shouldLogGet(url);

        // Skip auth endpoints completely to avoid any chance of sensitive data capture
        if (isAuthEndpoint) {
            return next.handle();
        }

        // By default we don't log GET; we only log selected GET endpoints (page views / list pages)
        if (isGet && !shouldLogGet) {
            return next.handle();
        }

        const module = this.extractModule(url);
        const action = isGet ? 'VIEW' : this.methodToAction(method);

        return next.handle().pipe(
            tap((response) => {
                if (user) {
                    this.auditService.log({
                        userId: user.id,
                        action,
                        module,
                        entityId: response?.id || body?.id,
                        newValues: isGet ? { url } : body,
                        ipAddress: ip,
                        userAgent: headers['user-agent'],
                    }).catch(() => { }); // Don't block on audit log failures
                }
            }),
        );
    }

    private extractModule(url: string): string {
        const parts = url.split('/').filter(Boolean);
        // expects: /api/<module>/...
        return parts[1] || 'unknown';
    }

    private methodToAction(method: string): string {
        switch (method) {
            case 'POST': return 'CREATE';
            case 'PUT':
            case 'PATCH': return 'UPDATE';
            case 'DELETE': return 'DELETE';
            default: return method;
        }
    }

    private shouldLogGet(url: string): boolean {
        // remove query string
        const path = url.split('?')[0] || url;

        // avoid noisy or sensitive endpoints
        const blockedPrefixes = [
            '/api/audit',
            '/api/audit-logs',
            '/api/health',
            '/api/metrics',
            '/api/swagger',
        ];
        if (blockedPrefixes.some((p) => path.startsWith(p))) return false;

        // allowlist key business modules (tune as needed)
        const allowedPrefixes = [
            '/api/leads',
            '/api/customers',
            '/api/teams',
            '/api/users',
            '/api/tasks',
            '/api/activities',
            '/api/daily-reports',
            '/api/scraped-tenders',
            '/api/payments',
            '/api/invoices',
            '/api/targets',
        ];

        return allowedPrefixes.some((p) => path.startsWith(p));
    }
}
