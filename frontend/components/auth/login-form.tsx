'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()

  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  })

  // SCREAMING DEBUG: Watch for validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('[LoginForm] VALIDATION ERRORS:', errors)
    }
  }, [errors])

  async function onSubmit(data: LoginFormData) {
    window.alert('Login button clicked! Starting submission...')
    console.log('[LoginForm] SUBMIT TRIGGERED', {
      email: data.email,
    })

    setIsLoading(true)

    try {
      console.log('[LoginForm] CALLING LOGIN API')

      const response = await login({
        email: data.email,
        password: data.password,
      })

      console.log('[LoginForm] LOGIN SUCCESS. Data:', response)
      console.log('[LoginForm] DOCUMENT COOKIE:', document.cookie)

      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }

      toast.success('Login successful!')
      console.log('[LoginForm] Navigation to /how-it-works...')
      router.push('/how-it-works')

    } catch (error: any) {
      console.error('[LoginForm] LOGIN ERROR:', error)

      const message =
        error.response?.data?.detail ||
        'Login failed. Please try again.'

      toast.error(message)

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Email
        </label>

        <Input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          className="w-full"
        />

        {errors.email && (
          <p className="text-red-500 text-sm mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Password
        </label>

        <Input
          {...register('password')}
          type="password"
          placeholder="••••••••"
          className="w-full"
        />

        {errors.password && (
          <p className="text-red-500 text-sm mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember Me */}
      <div className="flex items-center gap-2">
        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="rememberMe"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <label
          htmlFor="rememberMe"
          className="text-sm text-foreground cursor-pointer"
        >
          Remember me
        </label>
      </div>

      {/* Forgot Password */}
      <div className="text-sm">
        <a
          href="#"
          className="text-primary hover:underline"
        >
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </Button>

    </form>
  )
}