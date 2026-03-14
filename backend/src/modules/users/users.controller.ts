import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Query,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get all users' })
    @ApiQuery({ name: 'role', required: false, enum: Role })
    findAll(@Req() req: any, @Query('role') role?: Role) {
        return this.usersService.findAll(role, req.user?.role);
    }

    @Get('options')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get users for dropdowns (paginated)' })
    @ApiQuery({ name: 'role', required: false, enum: Role })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '1-based page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (default: 50, max: 200)' })
    getOptions(
        @Req() req: any,
        @Query('role') role?: Role,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.usersService.getUserOptions({
            role,
            search,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 50,
        }, req.user?.role);
    }

    @Get('managers')
    @ApiOperation({ summary: 'Get all managers' })
    getManagers(@Req() req: any) {
        return this.usersService.getManagers(req.user?.role);
    }

    @Get('team')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: 'Get team members for current manager' })
    getTeamMembers(@Req() req: any, @CurrentUser('id') managerId: string) {
        return this.usersService.getTeamMembers(managerId, req.user?.role);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    getProfile(@Req() req: any, @CurrentUser('id') userId: string) {
        return this.usersService.findOne(userId, req.user?.role);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update current user profile' })
    updateProfile(
        @CurrentUser('id') userId: string,
        @Body() updateData: { firstName?: string; lastName?: string; email?: string; phone?: string }
    ) {
        return this.usersService.update(userId, updateData);
    }

    @Patch('change-password')
    @ApiOperation({ summary: 'Change current user password' })
    changePassword(
        @CurrentUser('id') userId: string,
        @Body() passwordData: { currentPassword: string; newPassword: string }
    ) {
        return this.usersService.changePassword(userId, passwordData.currentPassword, passwordData.newPassword);
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.usersService.findOne(id, req.user?.role);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Update user' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch(':id/assign-manager')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Assign manager to employee' })
    assignManager(@Param('id') employeeId: string, @Body() dto: AssignManagerDto) {
        return this.usersService.assignManager(employeeId, dto.managerId);
    }

    @Patch(':id/deactivate')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Deactivate user' })
    deactivate(@Param('id') id: string) {
        return this.usersService.deactivate(id);
    }

    @Patch(':id/activate')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Activate user' })
    activate(@Param('id') id: string) {
        return this.usersService.activate(id);
    }
}
