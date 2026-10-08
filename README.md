# BukuKas + Order WhatsApp

MVP aplikasi web untuk UMKM dengan:
- Buku kas pemasukan/pengeluaran
- Dashboard omzet, pengeluaran, laba
- Katalog produk
- Stok sederhana
- Database pelanggan
- Order
- Kirim detail order melalui WhatsApp
- Google Sheets sebagai database
- GitHub Pages sebagai frontend

## Struktur

```text
index.html
style.css
app.js
config.js
Code.gs
README.md
```

## 1. Buat Google Sheet

Buat satu Google Spreadsheet kosong.

Salin Spreadsheet ID dari URL:

`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

Masukkan ID tersebut ke `Code.gs`:

```js
const SPREADSHEET_ID = "ID_KAMU";
```

## 2. Buat Google Apps Script

Di Google Sheet:
Extensions → Apps Script

Hapus kode bawaan dan paste isi `Code.gs`.

Klik Deploy → New deployment:
- Type: Web app
- Execute as: Me
- Who has access: Anyone

Copy URL Web App.

## 3. Hubungkan frontend

Edit `config.js`:

```js
const API_URL = "URL_WEB_APP_GOOGLE_APPS_SCRIPT";
const STORE_ID = "TOKO-DEMO-001";
```

## 4. Upload ke GitHub

Buat repository baru, misalnya:

`buku-kas-order-wa`

Upload:
- index.html
- style.css
- app.js
- config.js
- README.md

Jangan upload `Code.gs` jika kamu tidak ingin source backend terlihat publik. Simpan Code.gs di Google Apps Script.

Aktifkan:
Settings → Pages → Deploy from branch → main → root.

## Catatan keamanan MVP

Versi ini cocok untuk validasi produk/demo dan UMKM awal. Belum memakai login/authentication per user. Untuk versi komersial/multi-tenant, tambahkan:
- Login
- Authentication/token
- Hak akses owner/staff
- Store ID yang aman
- Validasi request
- Rate limiting
- Audit log
- Backup
- Payment/subscription

## Roadmap versi berbayar

1. Login UMKM
2. Multi toko
3. Dashboard profit
4. Hutang/piutang
5. Stok otomatis dari order
6. Supplier
7. Laporan PDF
8. Export Excel
9. WhatsApp template
10. Reminder pelanggan
11. Subscription
12. Admin panel
