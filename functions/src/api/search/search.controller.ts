import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get('products')
    async search(
        @Query('q') q?: string,
        @Query('category') category?: string,
        @Query('minPrice') minPrice?: number,
        @Query('maxPrice') maxPrice?: number,
        @Query('vendorId') vendorId?: string,
        @Query('limit') limit?: number,
        @Query('lastValue') lastValue?: string,
        @Query('lastId') lastId?: string
    ) {
        return this.searchService.searchProducts({
            query: q,
            category,
            minPrice,
            maxPrice,
            vendorId,
            limit,
            lastValue,
            lastId
        });
    }
}
