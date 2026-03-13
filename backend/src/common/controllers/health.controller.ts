import { Controller, Get, Head } from '@nestjs/common';

@Controller('')
export class HealthController {
    @Get()
    @Head()
    healthCheck() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
