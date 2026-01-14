
import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

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
}
