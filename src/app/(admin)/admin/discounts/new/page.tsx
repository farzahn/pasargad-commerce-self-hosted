'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { getPocketBaseClient } from '@/lib/pocketbase'

// Zod schema for discount form validation
const discountSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(20, 'Code must be at most 20 characters')
      .regex(
        /^[A-Z0-9_-]+$/,
        'Code can only contain uppercase letters, numbers, underscores, and hyphens'
      ),
    type: z.enum(['percentage', 'fixed'], {
      required_error: 'Please select a discount type',
    }),
    value: z
      .number({ required_error: 'Value is required' })
      .positive('Value must be greater than 0'),
    minOrderValue: z
      .number()
      .nonnegative('Minimum order value cannot be negative')
      .optional(),
    maxUses: z
      .number()
      .int('Maximum uses must be a whole number')
      .positive('Maximum uses must be greater than 0')
      .optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.type === 'percentage' && data.value > 100) {
        return false
      }
      return true
    },
    {
      message: 'Percentage value cannot exceed 100',
      path: ['value'],
    }
  )

type DiscountFormData = z.infer<typeof discountSchema>

export default function NewDiscountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      code: '',
      type: 'percentage',
      value: 0,
      minOrderValue: undefined,
      maxUses: undefined,
      expiresAt: '',
      isActive: true,
    },
  })

  const discountType = watch('type')
  const isActive = watch('isActive')

  // Auto-format code to uppercase
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
    setValue('code', formatted, { shouldValidate: true })
  }

  const onSubmit = async (data: DiscountFormData) => {
    setSubmitting(true)

    try {
      const pb = getPocketBaseClient()

      // Prepare discount data for PocketBase
      // Convert to cents for price values
      const discountData: Record<string, unknown> = {
        code: data.code,
        type: data.type,
        value: data.type === 'fixed' ? Math.round(data.value * 100) : data.value,
        usedCount: 0,
        isActive: data.isActive,
        minOrderValue: 0,
        maxUses: 0,
      }

      // Add optional fields only if they have values
      if (data.minOrderValue !== undefined && data.minOrderValue > 0) {
        discountData.minOrderValue = Math.round(data.minOrderValue * 100)
      }

      if (data.maxUses !== undefined && data.maxUses > 0) {
        discountData.maxUses = data.maxUses
      }

      if (data.expiresAt) {
        discountData.expiresAt = new Date(data.expiresAt).toISOString()
      }

      await pb.collection('discounts').create(discountData)

      toast({
        title: 'Discount created',
        description: `Discount code "${data.code}" has been created successfully.`,
      })

      router.push('/admin/discounts')
    } catch (error) {
      console.error('Error creating discount:', error)
      toast({
        title: 'Error',
        description: 'Failed to create discount. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/discounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Discount</h1>
          <p className="text-muted-foreground">
            Add a new discount code for your customers
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Discount Details
              </CardTitle>
              <CardDescription>
                Configure the discount code settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Discount Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Discount Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., SUMMER2025"
                  {...register('code')}
                  onChange={handleCodeChange}
                  className="font-mono uppercase"
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Customers will enter this code at checkout
                </p>
              </div>

              {/* Type and Value */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Discount Type *</Label>
                  <Select
                    value={discountType}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setValue('type', value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">
                    {discountType === 'percentage' ? 'Percentage *' : 'Amount *'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="value"
                      type="number"
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      min="0"
                      max={discountType === 'percentage' ? '100' : undefined}
                      placeholder={discountType === 'percentage' ? '10' : '5.00'}
                      {...register('value', { valueAsNumber: true })}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {discountType === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                  {errors.value && (
                    <p className="text-sm text-destructive">
                      {errors.value.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Settings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minOrderValue">Minimum Order Value</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="minOrderValue"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register('minOrderValue', { valueAsNumber: true })}
                      className="pl-7"
                    />
                  </div>
                  {errors.minOrderValue && (
                    <p className="text-sm text-destructive">
                      {errors.minOrderValue.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave blank for no minimum
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses">Maximum Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Unlimited"
                    {...register('maxUses', { valueAsNumber: true })}
                  />
                  {errors.maxUses && (
                    <p className="text-sm text-destructive">
                      {errors.maxUses.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave blank for unlimited uses
                  </p>
                </div>
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiration Date</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  {...register('expiresAt')}
                />
                {errors.expiresAt && (
                  <p className="text-sm text-destructive">
                    {errors.expiresAt.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave blank for no expiration
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-xs text-muted-foreground">
                      {isActive
                        ? 'Discount is available for use'
                        : 'Discount is disabled'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Discount'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/discounts')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
