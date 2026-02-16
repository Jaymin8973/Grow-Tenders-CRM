
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('targets')
@UseGuards(JwtAuthGuard)
export class TargetsController {
    constructor(private readonly targetsService: TargetsService) { }

    @Post()
    async setTarget(@Body() body: { userId: string; amount: number; month: string }) {
        return this.targetsService.setTarget(body.userId, body.amount, new Date(body.month));
    }

    @Get('my-stats')
    async getMyStats(@Req() req: any, @Query('month') month?: string) {
        const date = month ? new Date(month) : new Date();
        return this.targetsService.getEmployeeStats(req.user.id, date);
    }

    @Get('user-stats/:userId')
    async getUserStats(@Param('userId') userId: string, @Query('month') month?: string) {
        const date = month ? new Date(month) : new Date();
        return this.targetsService.getEmployeeStats(userId, date);
    }
    @Get()
    async findAll(@Query('month') month?: string) {
        const date = month ? new Date(month) : new Date();
        return this.targetsService.findAll(date);
    }
}
