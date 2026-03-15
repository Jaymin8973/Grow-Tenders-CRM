import {
    Controller,
    Post,
    Body,
    Get,
    Patch,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerRefreshDto } from './dto/customer-refresh.dto';
import { CustomerUpdateDto } from './dto/customer-update.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PublicAuthService } from './public-auth.service';
import { CustomerJwtAuthGuard } from '../../common/guards/customer-jwt.guard';
import { CurrentCustomer } from '../../common/decorators/current-customer.decorator';

@ApiTags('Public Auth')
@Controller('public/auth')
export class PublicAuthController {
    private readonly logger = new Logger(PublicAuthController.name);

    constructor(private readonly publicAuthService: PublicAuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new customer' })
    @ApiResponse({ status: 201, description: 'Customer registered successfully' })
    @ApiResponse({ status: 400, description: 'Email already exists or invalid data' })
    async register(@Body() registerDto: CustomerRegisterDto) {
        return this.publicAuthService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Customer login' })
    @ApiResponse({ status: 200, description: 'Successfully logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: CustomerLoginDto) {
        return this.publicAuthService.login(loginDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh customer access token' })
    @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshTokens(@Body() refreshDto: CustomerRefreshDto) {
        return this.publicAuthService.refreshTokens(refreshDto.refreshToken);
    }

    @Post('logout')
    @UseGuards(CustomerJwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Customer logout' })
    @ApiResponse({ status: 200, description: 'Successfully logged out' })
    async logout(@CurrentCustomer('id') customerId: string) {
        return this.publicAuthService.logout(customerId);
    }

    @Get('me')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Get current customer profile' })
    @ApiResponse({ status: 200, description: 'Customer profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@CurrentCustomer('id') customerId: string) {
        return this.publicAuthService.getProfile(customerId);
    }

    @Patch('profile')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Update customer profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateProfile(
        @CurrentCustomer('id') customerId: string,
        @Body() updateDto: CustomerUpdateDto,
    ) {
        return this.publicAuthService.updateProfile(customerId, updateDto);
    }

    @Post('change-password')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Change customer password' })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid current password' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async changePassword(
        @CurrentCustomer('id') customerId: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.publicAuthService.changePassword(customerId, changePasswordDto);
    }

    @Post('activate-trial')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Activate 3-day free trial (no state required - users can view tenders but no auto alerts)' })
    @ApiResponse({ status: 200, description: 'Free trial activated successfully' })
    @ApiResponse({ status: 400, description: 'Free trial already used or invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async activateTrial(
        @CurrentCustomer('id') customerId: string,
        @Body('state') state?: string,
    ) {
        return this.publicAuthService.activateFreeTrial(customerId, state);
    }
}
