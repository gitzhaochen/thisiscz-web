'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePostApiUsersGoogleLogin } from '@/lib/api/generated'
import { Locale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { setAccessToken } from '@/lib/auth'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { GoogleLogin } from '@react-oauth/google'

const formSchema = z.object({
  email: z.string().email({
    message: '请输入有效的邮箱地址',
  }),
  password: z.string().min(6, {
    message: '密码至少需要6个字符',
  }),
})

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  // const form = useForm<z.infer<typeof formSchema>>({
  //   resolver: zodResolver(formSchema),
  //   defaultValues: {
  //     email: '',
  //     password: '',
  //   },
  // })

  // const { mutate: login, isPending } = useMutation({
  //   mutationFn: async (values: z.infer<typeof formSchema>) => {
  //     const response = await apiFetch('/users/login', {
  //       method: 'POST',
  //       body: JSON.stringify(values),
  //     })
  //     return response
  //   },
  //   onSuccess: (response: any) => {
  //     toast.success('登录成功！')
  //     form.reset()
  //     setAccessToken(response.token)
  //     window.location.href = `/${locale}`
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.message)
  //   },
  // })

  // function onSubmit(values: z.infer<typeof formSchema>) {
  //   // 纯前端实现，不调用接口
  //   console.log('登录信息:', values)
  //   login(values)
  //   toast.success('登录成功！', {
  //     description: `欢迎回来，${values.email}`,
  //   })
  //   form.reset()
  // }

  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const { mutate: googleLogin, isPending: isGoogleLoginPending } = usePostApiUsersGoogleLogin({
    mutation: {
      onSuccess: (response: any) => {
        toast.success('登录成功！')
        setAccessToken(response.token)
        window.location.href = returnTo ? decodeURIComponent(returnTo) : `/${locale}`
      },
      onError: (error: any) => {
        toast.error(error.message)
      },
    },
  })

  return (
    <div className="flex h-[80vh] items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center justify-center space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold">Sign In</h2>
          <p className="text-muted-foreground">Please enter your account information</p>
        </div>
        {/* <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="example@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? '登录中...' : '登录'}
            </Button>
          </form>
        </Form> */}
        <GoogleOAuthProvider clientId="88217144660-k2ap911dqcrcte6bekgdorh13tu84gl2.apps.googleusercontent.com">
          <GoogleLogin
            ux_mode="popup"
            onSuccess={(credentialResponse: any) => {
              googleLogin({ data: { credential: credentialResponse.credential } })
            }}
            onError={() => {
              console.log('Login Failed')
            }}
          />
        </GoogleOAuthProvider>
      </div>
    </div>
  )
}
