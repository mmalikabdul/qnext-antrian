'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, User as UserIcon, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const { toast } = useToast();
  const { login } = useAuth(); // Gunakan Hook baru
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      
      toast({
        variant: "success",
        title: 'Login Berhasil!',
        description: `Selamat datang kembali.`,
      });
      // Redirect sudah dihandle di dalam auth-context login()

    } catch (error: any) {
      console.error("Login failed:", error);
      setError(error.message || 'Email atau password salah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Halaman Utama
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="space-y-4 p-6">
             <Image
                src="/qnext-logo.svg"
                alt="Qnext Logo"
                width={200}
                height={62}
                className="mx-auto"
              />
            <CardTitle className="text-center text-2xl font-bold">Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Login Gagal</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@example.com" 
                  required 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="pl-10"
                  placeholder='******'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
             <p className="text-sm text-muted-foreground text-center">
                Masukan email dan password staff atau admin.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Memproses...' : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Masuk
                  </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
