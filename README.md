# Q-NEXT: Sistem Antrian Modern

Q-NEXT adalah aplikasi sistem antrian berbasis web yang dirancang untuk efisiensi, kecepatan, dan pengalaman pengguna yang modern. Aplikasi ini menggunakan arsitektur **Monorepo** yang memisahkan Backend dan Frontend namun tetap dalam satu repositori yang terintegrasi.

## 🛠 Teknologi yang Digunakan

### Backend (`apps/backend`)
*   **Runtime:** [Bun](https://bun.sh/) (Javascript Runtime ultra-cepat)
*   **Framework:** [ElysiaJS](https://elysiajs.com/) (Framework web berkinerja tinggi)
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Realtime:** Socket.io (WebSocket)
*   **Auth:** JWT (JSON Web Token)

### Frontend (`apps/frontend`)
*   **Framework:** Next.js 14 (App Router)
*   **Styling:** Tailwind CSS + Shadcn UI
*   **State Management:** React Context + Hooks (Modular Architecture)
*   **Charts:** Recharts
*   **HTTP Client:** Fetch API Wrapper (Custom)

---

## 📋 Prasyarat

Pastikan Anda telah menginstal:
*   [Bun](https://bun.sh/) (v1.0.0 atau lebih baru)
*   [Docker Desktop](https://www.docker.com/) (Untuk database PostgreSQL)

---

## 🚀 Cara Menjalankan Aplikasi (Development)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer lokal Anda.

### 1. Setup Database
Jalankan container PostgreSQL menggunakan Docker Compose:

```bash
docker-compose up -d db
```

### 2. Setup Backend

Buka terminal baru dan masuk ke folder backend:

```bash
cd apps/backend
```

Install dependencies:
```bash
bun install
```

Buat file `.env` (jika belum ada) dan sesuaikan isinya:
```bash
# Buat file .env di apps/backend/.env
DATABASE_URL="postgresql://qnext_user:qnext_password@localhost:5432/qnext_antrian?schema=public"
JWT_SECRET="rahasia_super_aman_ganti_ini_di_production"
PORT=3001
```

Jalankan migrasi database dan seeding data awal (Admin & Layanan Default):
```bash
bunx prisma migrate dev --name init
bun run src/prisma/seed.ts
```

Jalankan server backend:
```bash
bun run dev
```
*Server akan berjalan di `http://localhost:3001`.*
*Dokumentasi API (Swagger) dapat diakses di `http://localhost:3001/swagger`.*

### 3. Setup Frontend

Buka terminal baru lainnya dan masuk ke folder frontend:

```bash
cd apps/frontend
```

Install dependencies:
```bash
bun install
```

Buat file `.env.local` untuk konfigurasi API:
```bash
# Buat file apps/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

Jalankan aplikasi frontend:
```bash
bun run dev
```
*Aplikasi akan berjalan di `http://localhost:3000`.*

---

## 🐳 Cara Menjalankan dengan Docker (Production Mode)

Jika Anda ingin menjalankan seluruh stack (Database, Backend, Frontend) sekaligus dalam mode produksi:

```bash
docker-compose up -d --build
```

*   Frontend: `http://localhost:3000`
*   Backend: `http://localhost:3001`
*   Database: Port `5432`

---

## 🔑 Akun Default (Seeding)

Setelah menjalankan `seed.ts`, Anda dapat menggunakan akun berikut untuk login:

*   **Role:** Admin
*   **Email:** `admin@qnext.com`
*   **Password:** `admin123`

---

## 📱 Modul Aplikasi

Aplikasi ini terdiri dari 4 modul utama yang dapat diakses melalui Landing Page:

1.  **Kiosk (`/kiosk`)**:
    *   Antarmuka untuk pengunjung mengambil nomor antrian.
    *   Mendukung pencetakan tiket (via browser print).

2.  **Monitor (`/monitor`)**:
    *   Tampilan layar besar untuk ruang tunggu.
    *   Menampilkan nomor yang sedang dipanggil, video playlist, dan teks berjalan.
    *   **Fitur Suara:** Mengumumkan nomor antrian secara otomatis (Text-to-Speech).

3.  **Staff Panel (`/staff`)**:
    *   Untuk petugas loket memanggil antrian.
    *   Fitur: Call Next, Recall, Skip, Complete.

4.  **Admin Dashboard (`/admin`)**:
    *   Manajemen User (Staff/Admin).
    *   Manajemen Layanan & Loket.
    *   Pengaturan Tampilan Monitor.
    *   Laporan Statistik Antrian.

---

## 📂 Struktur Folder

```
.
├── apps/
│   ├── backend/       # Kode sumber API & Database
│   │   ├── prisma/    # Schema database & Migrasi
│   │   └── src/       # Controller, Service, Middleware
│   └── frontend/      # Kode sumber UI (Next.js)
│       ├── src/
│       │   ├── app/          # Halaman (Routing)
│       │   ├── features/     # Logika per Fitur (Admin, Kiosk, Monitor, Staff)
│       │   ├── components/   # Komponen UI Reusable
│       │   └── lib/          # Konfigurasi (API Client, Socket)
├── docker-compose.yml # Konfigurasi Docker
└── README.md          # Dokumentasi ini
```

## 🧪 Testing

Untuk menjalankan testing (Coming Soon):

```bash
cd apps/backend && bun test
```

---

© 2026 Q-NEXT Team.
