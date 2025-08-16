'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LogIn, User, KeyRound } from 'lucide-react';
import BkpmLogo from '@/components/icons/bkpm-logo';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = React.useState('staff');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would perform authentication here.
    // For this demo, we'll just redirect based on the selected role.
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/staff');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" asChild>
          <Link href="/">
            &larr; Kembali ke Kiosk
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center space-y-2">
            <div className="inline-block mx-auto">
              <BkpmLogo className="h-14 w-14 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Login Petugas</CardTitle>
            <CardDescription>
              Masuk untuk mengelola antrian atau melihat dasbor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" placeholder="contoh: budi" required className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" required className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih role Anda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Petugas</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Masuk
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
