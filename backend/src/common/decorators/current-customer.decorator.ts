import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentCustomer = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const customer = request.user;

        if (!customer) {
            return null;
        }

        return data ? customer[data] : customer;
    },
);
