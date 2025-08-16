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
import { LogIn, User, KeyRound } from 'lucide-react';
import BkpmLogo from '@/components/icons/bkpm-logo';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useQueue } from '@/context/queue-context';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { loginUser } = useQueue();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const auth = getAuth(app);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = 'staff'; // Default role

      if (userDocSnap.exists()) {
        userRole = userDocSnap.data().role;
      } else {
        // If user document doesn't exist, create one.
        // For this app, we'll assign 'admin' role based on a specific email.
        // In a real-world scenario, you might have a different way of assigning initial roles.
        if (user.email === 'admin@bkpm.go.id') {
          userRole = 'admin';
        }
        await setDoc(userDocRef, { email: user.email, role: userRole });
      }

      loginUser({ uid: user.uid, email: user.email!, role: userRole });

      toast({
        title: 'Login Berhasil!',
        description: `Selamat datang kembali. Anda masuk sebagai ${userRole}.`,
      });

      if (userRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/staff');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError('Email atau password salah. Silakan coba lagi.');
      } else {
        setError('Terjadi kesalahan saat login. Silakan coba lagi nanti.');
      }
      setIsLoading(false);
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
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@bkpm.go.id" 
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
                Gunakan akun yang telah Anda daftarkan di Firebase Console.
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
