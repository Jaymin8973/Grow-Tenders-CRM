import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { PermissionsService, ScreenAccessMap } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}

    @Get('screen-access')
    @ApiOperation({ summary: 'Get screen access config for MANAGER and EMPLOYEE (used by sidebar/route guards)' })
    getScreenAccess() {
        return this.permissionsService.getAllRoleScreenAccess();
    }

    @Put('screen-access')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Super Admin: Update screen access config for a role' })
    updateScreenAccess(@Body() body: { role: Role; screens: ScreenAccessMap }) {
        return this.permissionsService.updateRoleScreenAccess(body.role, body.screens);
    }
}
