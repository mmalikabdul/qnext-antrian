'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token reset tidak ditemukan. Silakan minta link reset password yang baru.');
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password tidak cocok.',
      });
      return;
    }
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Token reset tidak ada.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mereset password.');
      }

      setSuccess(true);
      toast({
        title: 'Berhasil',
        description: 'Password Anda telah berhasil direset. Anda sekarang bisa login.',
      });
      setTimeout(() => router.push('/login'), 3000);
    } catch (error: any) {
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Reset Password Berhasil</CardTitle>
            <CardDescription>
              Anda akan diarahkan ke halaman login sebentar lagi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p>Password Anda telah diubah.</p>
              <Link href="/login" className="underline mt-4 inline-block">
                Klik di sini untuk login sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password Anda</CardTitle>
          <CardDescription>
            Masukkan password baru Anda di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !token && (
             <div className="mb-4 text-center text-sm text-destructive">
                <p>{error}</p>
                <Link href="/forgot-password" className="underline mt-2 inline-block">
                    Minta link baru
                </Link>
             </div>
          )}
          {token && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Password Baru</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Mereset...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}