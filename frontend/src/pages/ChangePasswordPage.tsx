import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, Stack, TextField } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useChangePasswordMutation } from '../features/user/userApi'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type FormValues = z.infer<typeof changePasswordSchema>

export function ChangePasswordPage() {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema) as never,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setMessage(null)
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }).unwrap()
      setMessage({ type: 'success', text: 'Password changed successfully.' })
      reset()
      setTimeout(() => setMessage(null), 4000)
    } catch (err: unknown) {
      const data = err as { data?: { message?: string } }
      setMessage({
        type: 'error',
        text: data.data?.message || 'Could not change password. Try again.',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your current password, then choose a new one.
        </p>
      </div>

      {message ? (
        <Alert className="mb-6" severity={message.type}>
          {message.text}
        </Alert>
      ) : null}

      <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden border border-slate-100 p-6 sm:p-8">
        <Box component="form" onSubmit={handleSubmit(onSubmit)} className="max-w-md">
          <Stack spacing={3}>
            <TextField
              type="password"
              autoComplete="current-password"
              label="Current password"
              {...register('currentPassword')}
              error={Boolean(errors.currentPassword)}
              helperText={errors.currentPassword?.message}
            />
            <TextField
              type="password"
              autoComplete="new-password"
              label="New password"
              {...register('newPassword')}
              error={Boolean(errors.newPassword)}
              helperText={errors.newPassword?.message}
            />
            <TextField
              type="password"
              autoComplete="new-password"
              label="Confirm new password"
              {...register('confirmPassword')}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
            />
            <Button type="submit" disabled={isLoading} variant="contained">
              {isLoading ? 'Updating...' : 'Update password'}
            </Button>
          </Stack>
        </Box>
      </div>
    </div>
  )
}
