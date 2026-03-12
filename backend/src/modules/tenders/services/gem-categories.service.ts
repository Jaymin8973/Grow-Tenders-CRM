import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface GeMCategoryAPI {
    id: string;
    display_name: string;
    url: string;
    created_at: string;
}

interface GeMCategoryResponse {
    meta: { result: string; message: string | null };
    result: {
        data: GeMCategoryAPI[];
        paginatation_meta: { total_items: number; per_page: number; page: string };
    };
}

@Injectable()
export class GeMCategoriesService {
    private readonly logger = new Logger(GeMCategoriesService.name);
    // Use CSV download API - more reliable, gets all data in one request
    private readonly GEM_CATEGORIES_API = 'https://mkp.gem.gov.in/api/v1/browse_nodes/download_search_categories';

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Delete all categories from database
     */
    async deleteAllCategories(): Promise<number> {
        const result = await this.prisma.geMCategory.deleteMany({});
        this.logger.log(`Deleted ${result.count} categories`);
        return result.count;
    }

    /**
     * Sync all categories from GeM portal using CSV download API
     * Only syncs once per day - skips if already synced today
     */
    async syncCategories(): Promise<{ added: number; updated: number; total: number; skipped?: boolean }> {
        this.logger.log('Starting GeM categories sync from CSV API...');

        try {
            // Check if already synced today
            const lastSyncedCategory = await this.prisma.geMCategory.findFirst({
                where: { isActive: true },
                orderBy: { lastSynced: 'desc' },
                select: { lastSynced: true },
            });

            if (lastSyncedCategory?.lastSynced) {
                const lastSync = new Date(lastSyncedCategory.lastSynced);
                const now = new Date();
                const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
                
                if (hoursSinceSync < 24) {
                    this.logger.log(`Categories already synced ${Math.round(hoursSinceSync)} hours ago. Skipping sync.`);
                    const count = await this.prisma.geMCategory.count({ where: { isActive: true } });
                    return { added: 0, updated: 0, total: count, skipped: true };
                }
            }

            // Fetch all categories in one CSV request
            const url = `${this.GEM_CATEGORIES_API}?_ln=en&rows=20000`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/csv',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const csvData = await response.text();
            const categories = this.parseCSV(csvData);

            this.logger.log(`Fetched ${categories.length} categories from CSV`);

            let added = 0;
            let updated = 0;
            const now = new Date();

            // Use transaction for batch upsert
            const batchSize = 500;
            for (let i = 0; i < categories.length; i += batchSize) {
                const batch = categories.slice(i, i + batchSize);

                // Process batch in parallel with Promise.all
                await Promise.all(batch.map(async (category) => {
                    try {
                        const gemId = this.extractIdFromUrl(category.url);
                        
                        // Use upsert - more efficient than find + create/update
                        const result = await this.prisma.geMCategory.upsert({
                            where: { gemId },
                            create: {
                                gemId,
                                name: category.name,
                                gemUrl: category.url,
                                lastSynced: now,
                                isActive: true,
                            },
                            update: {
                                name: category.name,
                                gemUrl: category.url,
                                lastSynced: now,
                                isActive: true,
                            },
                        });

                        // Check if it was created or updated
                        if (result.createdAt === result.updatedAt) {
                            added++;
                        } else {
                            updated++;
                        }
                    } catch (error) {
                        // Skip duplicates or errors
                    }
                }));

                // Log progress every 1000 categories
                if ((i + batchSize) % 1000 === 0 || i + batchSize >= categories.length) {
                    this.logger.log(`Processed ${Math.min(i + batchSize, categories.length)}/${categories.length} categories`);
                }
            }

            this.logger.log(`Categories sync complete: ${added} added, ${updated} updated, ${categories.length} total`);
            return { added, updated, total: categories.length };
        } catch (error: any) {
            this.logger.error('Failed to sync GeM categories', error.message);
            throw error;
        }
    }

    /**
     * Parse CSV data from GeM API
     */
    private parseCSV(csvData: string): { name: string; url: string }[] {
        const lines = csvData.split('\n');
        const categories: { name: string; url: string }[] = [];

        // Skip header line if present
        const startIndex = lines[0]?.toLowerCase().includes('name') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            try {
                const parsed = this.parseCSVLine(line);
                if (parsed.name && parsed.url) {
                    categories.push(parsed);
                }
            } catch (error) {
                // Skip malformed lines
            }
        }

        return categories;
    }

    /**
     * Parse a single CSV line
     */
    private parseCSVLine(line: string): { name: string; url: string } {
        // Handle quoted values
        if (line.startsWith('"')) {
            const endQuote = line.indexOf('",', 1);
            if (endQuote > 0) {
                const name = line.substring(1, endQuote).replace(/""/g, '"');
                const rest = line.substring(endQuote + 2);
                const commaIndex = rest.indexOf(',');
                const url = commaIndex > 0 ? rest.substring(0, commaIndex) : rest;
                return { name: name.trim(), url: url.trim() };
            }
        }

        // Simple CSV parse
        const parts = line.split(',');
        return {
            name: (parts[0] || '').trim(),
            url: (parts[1] || '').trim(),
        };
    }

    /**
     * Extract unique ID from GeM URL
     */
    private extractIdFromUrl(url: string): string {
        // URL format: /category-name/search or similar
        // Use URL hash as ID
        const parts = url.split('/').filter(Boolean);
        return parts.length > 0 ? parts.join('_') : url;
    }

    /**
     * Get all active categories
     */
    async getAllCategories(): Promise<string[]> {
        const categories = await this.prisma.geMCategory.findMany({
            where: { isActive: true },
            select: { name: true },
            orderBy: { name: 'asc' },
        });

        return categories.map(c => c.name);
    }

    /**
     * Search categories by name
     */
    async searchCategories(search: string, limit: number = 50): Promise<string[]> {
        const categories = await this.prisma.geMCategory.findMany({
            where: {
                isActive: true,
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
            select: { name: true },
            orderBy: { name: 'asc' },
            take: limit,
        });

        return categories.map(c => c.name);
    }

    /**
     * Get paginated categories
     */
    async getCategoriesPaginated(page: number = 1, limit: number = 50, search?: string) {
        const skip = (page - 1) * limit;

        const where: any = {
            isActive: true,
        };
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive' as const,
            };
        }

        const [categories, total] = await Promise.all([
            this.prisma.geMCategory.findMany({
                where,
                select: { id: true, name: true, gemUrl: true, lastSynced: true },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.geMCategory.count({ where }),
        ]);

        return {
            data: categories,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Find best matching category for a tender
     * Uses fuzzy matching to find the closest category
     */
    async findBestMatch(tenderCategory: string): Promise<string | null> {
        if (!tenderCategory) return null;

        // First try exact match
        const exact = await this.prisma.geMCategory.findFirst({
            where: {
                name: tenderCategory,
                isActive: true,
            },
        });

        if (exact) return exact.name;

        // Try case-insensitive match
        const caseInsensitive = await this.prisma.geMCategory.findFirst({
            where: {
                name: {
                    equals: tenderCategory,
                    mode: 'insensitive',
                },
                isActive: true,
            },
        });

        if (caseInsensitive) return caseInsensitive.name;

        // Try contains match
        const contains = await this.prisma.geMCategory.findFirst({
            where: {
                name: {
                    contains: tenderCategory,
                    mode: 'insensitive',
                },
                isActive: true,
            },
        });

        if (contains) return contains.name;

        // Try reverse contains (category contains tender category)
        const reverseContains = await this.prisma.geMCategory.findFirst({
            where: {
                isActive: true,
            },
            select: { name: true },
        });

        // No match found - return the original tender category
        return null;
    }
}
