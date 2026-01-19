import { Elysia, t } from "elysia";
import { join } from "path";

export const UploadController = new Elysia({ prefix: "/upload" })
  .post(
    "/",
    async ({ body: { file }, set }) => {
      try {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = join("public/uploads", fileName);
        
        // Simpan file ke disk menggunakan Bun
        await Bun.write(filePath, file);

        // Buat URL (sesuaikan dengan domain/port server Anda)
        // Kita bisa gunakan base URL dari env atau hardcode untuk MVP
        const baseUrl = process.env.BASE_URL || "http://localhost:3001";
        const fileUrl = `${baseUrl}/public/uploads/${fileName}`;

        return {
          success: true,
          message: "File uploaded successfully",
          url: fileUrl,
          fileName: fileName
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to upload file",
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    },
    {
      body: t.Object({
        file: t.File({
          maxSize: "10m", // Limit 10MB
          type: ["image/jpeg", "image/png", "application/pdf", "image/webp"]
        })
      })
    }
  );
