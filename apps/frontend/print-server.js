// print-server.js
const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

const app = express();
app.use(cors()); // Izinkan request dari domain lain (termasuk localhost browser)
app.use(express.json());

const PORT = 4000; // Port untuk server jembatan

app.post('/print', async (req, res) => {
  console.log('Menerima permintaan cetak:', req.body);
  const { ticketNumber, serviceName, timestamp } = req.body;

  if (!ticketNumber || !serviceName || !timestamp) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
  }

  // --- Konfigurasi Printer ---
  // Sesuaikan `type` dan `interface` dengan printer Anda.
  // Type: 'epson', 'star', dll.
  // Interface: 'printer:NAMA_PRINTER_ANDA' (untuk Windows) atau '/dev/usb/lp0' (untuk Linux)
  // Anda bisa melihat NAMA_PRINTER_ANDA di Control Panel > Devices and Printers
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON, // Ganti sesuai tipe printer Anda
    interface: 'printer:POS-80C', // GANTI DENGAN NAMA PRINTER ANDA
    characterSet: 'SLOVENIA', // Atur character set jika perlu
    removeSpecialCharacters: false,
    lineCharacter: "=",
    options: {
      timeout: 5000
    }
  });

  try {
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.error('Printer tidak terhubung!');
      return res.status(500).json({ success: false, message: 'Printer tidak terhubung.' });
    }

    // --- Desain Struk ---
    printer.alignCenter();
    // Anda bisa menambahkan logo jika printer mendukung
    // const logo = await ThermalPrinter.getBase64Image(path.join(__dirname, 'public/qnext-logo.png'));
    // printer.graphics(logo);
    printer.println("Selamat Datang di Q-NEXT");
    printer.println("--------------------------------");
    printer.alignLeft();
    printer.println(`Layanan: ${serviceName}`);
    printer.println(`Tanggal: ${new Date(timestamp).toLocaleString('id-ID')}`);
    printer.println("--------------------------------");
    printer.alignCenter();
    printer.println("NOMOR ANTRIAN ANDA");
    printer.setTextSize(2, 2); // Buat teks nomor antrian lebih besar
    printer.bold(true);
    printer.println(ticketNumber);
    printer.bold(false);
    printer.setTextSize(0, 0); // Kembali ke ukuran normal
    printer.println("--------------------------------");
    printer.println("Mohon tunggu hingga nomor Anda dipanggil.");
    printer.println("Terima kasih.");
    printer.feed(3); // Beri jarak sebelum memotong kertas
    printer.cut();

    await printer.execute();
    console.log('Cetak berhasil!');
    res.json({ success: true, message: 'Berhasil mencetak tiket.' });

  } catch (error) {
    console.error('Gagal mencetak:', error);
    res.status(500).json({ success: false, message: 'Gagal mencetak tiket.', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server Jembatan Cetak berjalan di http://localhost:${PORT}`);
});
