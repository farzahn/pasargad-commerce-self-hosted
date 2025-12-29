'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { generateSlug } from '@/lib/utils'
import { getPocketBaseClient } from '@/lib/pocketbase'
import type { Category } from '@/types/pocketbase'

// Zod schema for variant option
const variantOptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  priceModifier: z.number(),
  metadata: z.record(z.union([z.string(), z.number()])).optional(),
})

// Zod schema for product form
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  description: z.string().min(1, 'Description is required'),
  basePrice: z.number().min(1, 'Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  tags: z.string(),
  status: z.enum(['active', 'inactive', 'draft', 'archived']),
  isFeatured: z.boolean(),
  badge: z.enum(['new', 'sale', 'bestseller', 'none']),
  sizes: z.array(variantOptionSchema),
  colors: z.array(variantOptionSchema),
  options: z.array(variantOptionSchema),
})

type ProductFormData = z.infer<typeof productFormSchema>

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      basePrice: 0,
      category: '',
      tags: '',
      status: 'active',
      isFeatured: false,
      badge: 'none',
      sizes: [],
      colors: [],
      options: [],
    },
  })

  const {
    fields: sizeFields,
    append: appendSize,
    remove: removeSize,
  } = useFieldArray({ control, name: 'sizes' })

  const {
    fields: colorFields,
    append: appendColor,
    remove: removeColor,
  } = useFieldArray({ control, name: 'colors' })

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: 'options' })

  useEffect(() => {
    async function fetchCategories() {
      try {
        const pb = getPocketBaseClient()
        const result = await pb.collection('categories').getList<Category>(1, 500, {
          sort: 'order',
        })
        setCategories(result.items)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      const totalImages = imageFiles.length + files.length
      if (totalImages > 5) {
        toast({
          title: 'Too many images',
          description: 'Maximum 5 images allowed per product.',
          variant: 'destructive',
        })
        return
      }

      // Validate file types and sizes
      const validFiles = files.filter((file) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not a valid image type.`,
            variant: 'destructive',
          })
          return false
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 5MB limit.`,
            variant: 'destructive',
          })
          return false
        }
        return true
      })

      setImageFiles((prev) => [...prev, ...validFiles])

      // Create previews
      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    },
    [imageFiles.length, toast]
  )

  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const onSubmit = async (data: ProductFormData) => {
    if (imageFiles.length === 0) {
      toast({
        title: 'Images required',
        description: 'Please add at least one product image.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const pb = getPocketBaseClient()

      // Generate slug from name
      const slug = generateSlug(data.name)

      // Parse tags from comma-separated string
      const tags = data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Prepare form data for PocketBase
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('slug', slug)
      formData.append('description', data.description)
      formData.append('basePrice', data.basePrice.toString())
      formData.append('sku', data.sku)
      formData.append('category', data.category)
      formData.append('tags', JSON.stringify(tags))
      formData.append('sizes', JSON.stringify(data.sizes))
      formData.append('colors', JSON.stringify(data.colors))
      formData.append('options', JSON.stringify(data.options))
      formData.append('status', data.status)
      formData.append('isFeatured', data.isFeatured.toString())
      formData.append('badge', data.badge === 'none' ? '' : data.badge)

      // Append images
      imageFiles.forEach((file) => {
        formData.append('images', file)
      })

      await pb.collection('products').create(formData)

      toast({
        title: 'Product created',
        description: 'The product has been successfully created.',
      })

      router.push('/admin/products')
    } catch (error) {
      console.error('Error creating product:', error)
      toast({
        title: 'Error',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Product</h1>
          <p className="text-muted-foreground">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the product details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter product name"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="e.g., PRD-001"
                      {...register('sku')}
                    />
                    {errors.sku && (
                      <p className="text-sm text-destructive">
                        {errors.sku.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    rows={4}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price (cents)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      {...register('basePrice', { valueAsNumber: true })}
                    />
                    {errors.basePrice && (
                      <p className="text-sm text-destructive">
                        {errors.basePrice.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enter price in cents (e.g., 2500 = $25.00)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      onValueChange={(value) => setValue('category', value)}
                      defaultValue=""
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Enter tags separated by commas"
                    {...register('tags')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas (e.g., featured, bestseller, limited)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload up to 5 images (JPEG, PNG, WebP, max 5MB each)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-colors hover:bg-muted/50">
                      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Upload Image
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {imagePreviews.length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    The first image will be used as the main product image
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>
                  Configure sizes, colors, and other options with price modifiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sizes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sizes</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendSize({ name: '', priceModifier: 0 })}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Size
                    </Button>
                  </div>
                  {sizeFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Size name (e.g., Small, Large)"
                          {...register(`sizes.${index}.name`)}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="1"
                          placeholder="+0"
                          {...register(`sizes.${index}.priceModifier`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSize(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Colors */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Colors</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendColor({ name: '', priceModifier: 0, metadata: { hex: '#000000' } })
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Color
                    </Button>
                  </div>
                  {colorFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Color name (e.g., Red, Blue)"
                          {...register(`colors.${index}.name`)}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="1"
                          placeholder="+0"
                          {...register(`colors.${index}.priceModifier`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeColor(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Other Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Other Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendOption({ name: '', priceModifier: 0 })}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                  {optionFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Option name (e.g., Canvas, Paper)"
                          {...register(`options.${index}.name`)}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="1"
                          placeholder="+0"
                          {...register(`options.${index}.priceModifier`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Product Status</Label>
                  <Select
                    onValueChange={(value: 'active' | 'inactive') =>
                      setValue('status', value)
                    }
                    defaultValue="active"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isFeatured">Featured</Label>
                    <p className="text-xs text-muted-foreground">Show on homepage</p>
                  </div>
                  <Switch
                    id="isFeatured"
                    checked={watch('isFeatured')}
                    onCheckedChange={(checked) => setValue('isFeatured', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="badge">Badge</Label>
                  <Select
                    onValueChange={(value: 'new' | 'sale' | 'bestseller' | 'none') =>
                      setValue('badge', value)
                    }
                    defaultValue="none"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No Badge" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Badge</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="bestseller">Bestseller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Product'
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/products">Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
