'use client';

import { useEffect } from 'react';

export default function BookingRedirect() {
    useEffect(() => {
        window.location.href = 'https://ui-login.oss.go.id/login';
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <p className="text-muted-foreground">Mengalihkan ke halaman login...</p>
        </div>
    );
}
