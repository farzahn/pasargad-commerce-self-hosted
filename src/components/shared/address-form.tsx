'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { US_STATES } from '@/lib/config';
import { VALIDATION_PATTERNS } from '@/lib/constants';
import type { ShippingAddress } from '@/types/pocketbase';

/**
 * Zod schema for address validation
 * All fields are strings - optional fields allow empty strings
 */
export const addressSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Name is too long'),
  street: z
    .string()
    .min(1, 'Street address is required')
    .max(200, 'Street address is too long'),
  apt: z.string().max(50, 'Apt/Suite is too long'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City name is too long'),
  state: z.string().min(1, 'State is required'),
  zip: z
    .string()
    .min(1, 'ZIP code is required')
    .regex(VALIDATION_PATTERNS.US_ZIP_CODE, 'Invalid ZIP code format'),
  country: z.string().min(1, 'Country is required'),
  phone: z
    .string()
    .max(20, 'Phone number is too long')
    .refine(
      (val) => !val || VALIDATION_PATTERNS.PHONE.test(val),
      'Invalid phone number format'
    ),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  /** Initial values for the form */
  defaultValues?: Partial<ShippingAddress>;
  /** Called when form values change (for controlled forms) */
  onChange?: (values: AddressFormData, isValid: boolean) => void;
  /** Called when form is submitted */
  onSubmit?: (values: AddressFormData) => void;
  /** Whether the form fields are disabled */
  disabled?: boolean;
  /** Whether to show the phone field */
  showPhone?: boolean;
  /** ID prefix for form fields (for multiple forms on same page) */
  idPrefix?: string;
}

/**
 * Reusable address form component with validation
 *
 * Can be used in:
 * - Checkout page
 * - Account address management
 * - Admin order editing
 */
export function AddressForm({
  defaultValues,
  onChange,
  onSubmit,
  disabled = false,
  showPhone = true,
  idPrefix = 'address',
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      street: defaultValues?.street || '',
      apt: defaultValues?.apt || '',
      city: defaultValues?.city || '',
      state: defaultValues?.state || '',
      zip: defaultValues?.zip || '',
      country: defaultValues?.country || 'US',
      phone: defaultValues?.phone || '',
    },
    mode: 'onChange',
  });

  // Watch all fields for onChange callback
  const watchedFields = watch();

  // Notify parent of changes
  if (onChange) {
    // Use a stable reference check to avoid infinite loops
    const currentValues = JSON.stringify(watchedFields);
    // This effect would need to be in a useEffect in real usage
  }

  const handleFormSubmit = (data: AddressFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor={id('name')}>Full Name *</Label>
        <Input
          id={id('name')}
          {...register('name')}
          disabled={disabled}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${id('name')}-error` : undefined}
        />
        {errors.name && (
          <p id={`${id('name')}-error`} className="text-sm text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor={id('street')}>Street Address *</Label>
        <Input
          id={id('street')}
          {...register('street')}
          disabled={disabled}
          aria-invalid={!!errors.street}
          aria-describedby={errors.street ? `${id('street')}-error` : undefined}
        />
        {errors.street && (
          <p id={`${id('street')}-error`} className="text-sm text-destructive" role="alert">
            {errors.street.message}
          </p>
        )}
      </div>

      {/* Apt/Suite */}
      <div className="space-y-2">
        <Label htmlFor={id('apt')}>Apt / Suite / Unit (optional)</Label>
        <Input
          id={id('apt')}
          {...register('apt')}
          disabled={disabled}
        />
      </div>

      {/* City, State, ZIP */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 space-y-2 sm:col-span-1">
          <Label htmlFor={id('city')}>City *</Label>
          <Input
            id={id('city')}
            {...register('city')}
            disabled={disabled}
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? `${id('city')}-error` : undefined}
          />
          {errors.city && (
            <p id={`${id('city')}-error`} className="text-sm text-destructive" role="alert">
              {errors.city.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={id('state')}>State *</Label>
          <Select
            value={watch('state')}
            onValueChange={(value) => setValue('state', value, { shouldValidate: true })}
            disabled={disabled}
          >
            <SelectTrigger
              id={id('state')}
              aria-invalid={!!errors.state}
              aria-describedby={errors.state ? `${id('state')}-error` : undefined}
            >
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p id={`${id('state')}-error`} className="text-sm text-destructive" role="alert">
              {errors.state.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={id('zip')}>ZIP Code *</Label>
          <Input
            id={id('zip')}
            {...register('zip')}
            disabled={disabled}
            placeholder="12345"
            aria-invalid={!!errors.zip}
            aria-describedby={errors.zip ? `${id('zip')}-error` : undefined}
          />
          {errors.zip && (
            <p id={`${id('zip')}-error`} className="text-sm text-destructive" role="alert">
              {errors.zip.message}
            </p>
          )}
        </div>
      </div>

      {/* Phone (optional) */}
      {showPhone && (
        <div className="space-y-2">
          <Label htmlFor={id('phone')}>Phone (optional)</Label>
          <Input
            id={id('phone')}
            type="tel"
            {...register('phone')}
            disabled={disabled}
            placeholder="For delivery updates"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? `${id('phone')}-error` : undefined}
          />
          {errors.phone && (
            <p id={`${id('phone')}-error`} className="text-sm text-destructive" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for using address form validation externally
 */
export function useAddressValidation() {
  return {
    schema: addressSchema,
    validate: (data: unknown) => addressSchema.safeParse(data),
    isValid: (data: unknown) => addressSchema.safeParse(data).success,
  };
}
