
import { Controller, Get, Param, Query, NotFoundException, Post, Body, Patch, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    async findAll(@Query('limit') limit: number) {
        return this.productsService.findAll(limit);
    }

    @Get('category/:slug')
    async findByCategory(@Param('slug') slug: string, @Query('limit') limit: number) {
        return this.productsService.findByCategory(slug, limit);
    }

    @Get('vendor/:vendorId')
    async findByVendor(@Param('vendorId') vendorId: string, @Query('limit') limit: number) {
        return this.productsService.findByVendor(vendorId, limit);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const product = await this.productsService.findOne(id);
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
