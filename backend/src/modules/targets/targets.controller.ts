
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, Patch, Delete } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('targets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TargetsController {
    constructor(private readonly targetsService: TargetsService) { }

    /**
     * Set/Assign target (Super Admin to Managers, Managers to Team Members)
     */
    @Post()
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    async setTarget(
        @Body() body: { userId: string; amount: number; month: string; parentTargetId?: string },
        @CurrentUser('id') assignedById: string,
        @CurrentUser('role') role: Role,
    ) {
        return this.targetsService.setTarget(
            body.userId,
            body.amount,
            new Date(body.month),
            assignedById,
            body.parentTargetId,
            role,
        );
    }

    @Get('my-stats')
    async getMyStats(@Req() req: any, @Query('month') month?: string) {
        const date = month ? new Date(month) : new Date();
        return this.targetsService.getEmployeeStats(req.user.id, date);
    }

    @Get('my-target')
    async getMyTarget(@Req() req: any, @Query('month') month?: string) {
        const date = month ? new Date(month) : new Date();
        return this.targetsService.getUserTarget(req.user.id, date);
    }

    /**
     * Get manager's target with team allocation info
     */
    @Get('manager-allocation')
    @Roles(Role.MANAGER, Role.SUPER_ADMIN)
    async getManagerAllocation(
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: Role,
        @Query('month') month?: string,
    ) {
        const date = month ? new Date(month) : new Date();
        return this.targetsService.getManagerAllocation(userId, date, role);
    }

    /**
     * Get team members for target assignment (for managers)
     */
    @Get('team-members')
    @Roles(Role.MANAGER)
    async getTeamMembersForTarget(@CurrentUser('id') managerId: string) {
        return this.targetsService.getTeamMembers(managerId);
    }

    @Get('user-stats/:userId')
    async getUserStats(@Param('userId') userId: string, @Query('month') month?: string) {
        const date = month ? new Date(month) : new Date();
        return this.targetsService.getEmployeeStats(userId, date);
    }

    /**
     * Get all targets for a month (Super Admin / Manager view)
     */
    @Get()
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    async findAll(@Req() req: any, @Query('month') month?: string) {
        const date = month ? new Date(month) : new Date();
        return this.targetsService.findAll(date, req.user?.id, req.user?.role);
    }

    /**
     * Update target amount
     */
    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    async updateTarget(
        @Param('id') targetId: string,
        @Body() body: { amount: number },
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: Role,
    ) {
        return this.targetsService.updateTarget(targetId, body.amount, userId, role);
    }

    /**
     * Delete target
     */
    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    async deleteTarget(@Param('id') targetId: string) {
        return this.targetsService.deleteTarget(targetId);
    }
}
