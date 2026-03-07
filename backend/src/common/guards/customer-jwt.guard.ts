import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
    constructor(private reflector: Reflector) {
        super(reflector);
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest(err: any, customer: any) {
        if (err || !customer) {
            throw err || new UnauthorizedException('Please login to continue');
        }
        return customer;
    }
}
