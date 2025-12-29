'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type { Category } from '@/types/pocketbase';

interface ProductFiltersProps {
  categories: Category[];
  availableTags?: string[];
}

// Default popular tags if none provided
const defaultTags = [
  'featured',
  'bestseller',
  'new',
  'sale',
  'limited',
  'exclusive',
];

export function ProductFilters({ categories, availableTags }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tags = availableTags && availableTags.length > 0 ? availableTags : defaultTags;

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || ''
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const applyFilters = (overrideCategory?: string, overrideTags?: string[]) => {
    const params = new URLSearchParams();

    if (searchQuery) params.set('q', searchQuery);
    if (searchParams.get('sort')) params.set('sort', searchParams.get('sort')!);

    // Use override category if provided, otherwise use current selection
    const categoryToUse =
      overrideCategory !== undefined ? overrideCategory : selectedCategory;
    if (categoryToUse) params.set('category', categoryToUse);

    // Use override tags if provided, otherwise use current selection
    const tagsToUse = overrideTags !== undefined ? overrideTags : selectedTags;
    if (tagsToUse.length > 0) params.set('tags', tagsToUse.join(','));

    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryClick = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    applyFilters(categorySlug, undefined);
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTags([]);
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
    router.push('/products');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="mb-3 font-semibold">Search</h3>
        <form onSubmit={handleSearchSubmit}>
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h3 className="mb-3 font-semibold">Categories</h3>
        <div className="space-y-2">
          <Button
            variant={selectedCategory === '' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleCategoryClick('')}
          >
            All Products
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => handleCategoryClick(category.slug)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="mb-3 font-semibold">Price Range</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="min-price" className="sr-only">
              Min Price
            </Label>
            <Input
              id="min-price"
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="max-price" className="sr-only">
              Max Price
            </Label>
            <Input
              id="max-price"
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Tags */}
      <div>
        <h3 className="mb-3 font-semibold">Tags</h3>
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag}`}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
              />
              <label
                htmlFor={`tag-${tag}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize"
              >
                {tag}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button className="w-full" onClick={() => applyFilters()}>
          Apply Filters
        </Button>
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear All
        </Button>
      </div>
    </div>
  );
}
