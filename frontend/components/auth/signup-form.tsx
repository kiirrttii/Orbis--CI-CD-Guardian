'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const { signup } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(data: SignupFormData) {
    setIsLoading(true)

    try {
      console.log('[Signup] Sending signup request')

      const response = await signup({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      })

      console.log('[Signup] SUCCESS:', response)

      toast.success('Account created successfully!')

      // Redirect after signup
      router.push('/how-it-works')

    } catch (error: any) {
      let message = 'Signup failed. Please try again.'
      
      if (error.response?.data) {
        const data = error.response.data
        if (typeof data.detail === 'string') {
          message = data.detail
        } else if (Array.isArray(data.detail)) {
          message = data.detail[0]?.msg || JSON.stringify(data.detail)
        } else if (data.message) {
          message = data.message
        }
      } else if (error.message) {
        message = error.message
      }

      toast.error(message)

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
        <Input
          {...register('full_name')}
          placeholder="John Doe"
          className="w-full"
        />
        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
        <Input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          className="w-full"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Password</label>
        <Input
          {...register('password')}
          type="password"
          placeholder="••••••••"
          className="w-full"
        />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
        <Input
          {...register('confirmPassword')}
          type="password"
          placeholder="••••••••"
          className="w-full"
        />
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full mt-4">
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </Button>
    </form>
  )
}
