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

        // Skip GET requests and auth endpoints
        if (method === 'GET' || url.includes('/auth')) {
            return next.handle();
        }

        const module = this.extractModule(url);
        const action = this.methodToAction(method);

        return next.handle().pipe(
            tap((response) => {
                if (user) {
                    this.auditService.log({
                        userId: user.id,
                        action,
                        module,
                        entityId: response?.id || body?.id,
                        newValues: body,
                        ipAddress: ip,
                        userAgent: headers['user-agent'],
                    }).catch(() => { }); // Don't block on audit log failures
                }
            }),
        );
    }

    private extractModule(url: string): string {
        const parts = url.split('/').filter(Boolean);
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
}
