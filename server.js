require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
// SESUDAH — tambahkan getGuru
const { bacaDb, simpanDb, getGuru } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

const SEKOLAH_LAT = parseFloat(process.env.SEKOLAH_LAT);
const SEKOLAH_LNG = parseFloat(process.env.SEKOLAH_LNG);
const RADIUS_METER = parseFloat(process.env.RADIUS_METER || "150");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "img", "logoskul.png"));
});
app.use(
  session({
    secret: process.env.SESSION_SECRET || "rahasia-default-ganti-ini",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 jam
  }),
);

// ---------- Util ----------

// Rumus haversine: menghitung jarak (meter) antara 2 titik koordinat GPS
function hitungJarakMeter(lat1, lng1, lat2, lng2) {
  const R = 6371000; // radius bumi dalam meter
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function tanggalHariIni() {
  const d = new Date();
  const tz = new Date(d.getTime() + 7 * 60 * 60 * 1000); // asumsi WIB, sesuaikan jika perlu
  return tz.toISOString().slice(0, 10); // YYYY-MM-DD
}

function waktuSekarang() {
  const d = new Date();
  const tz = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return tz.toISOString().slice(11, 16); // HH:MM
}

function hariIniMinggu() {
  return false; // <-- sementara dipaksa false biar bisa dites hari Minggu
  // const d = new Date();
  // const tz = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  // return tz.getUTCDay() === 0; // 0 = Minggu
}

function wajibAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Belum login sebagai admin" });
}

// ---------- API untuk halaman absen ----------

// SESUDAH — pakai getGuru() supaya mapel Piket & Mengajar DA/DAS ikut
app.get("/api/guru", (req, res) => {
  const db = bacaDb();
  const daftarGuru = getGuru(); // <-- ganti sumbernya
  const daftar = daftarGuru.map((g) => ({
    id: g.id,
    nama: g.nama,
    jabatan: g.jabatan,
    mapel: g.mapel,
    bisaMengajar: g.bisaMengajar,
  }));
  res.json({
    guru: daftar,
    kelas: db.kelas,
    jam: db.jam,
    hariMinggu: hariIniMinggu(),
    tanggalHariIni: tanggalHariIni(),
  });
});

// Submit absen kehadiran
app.post("/api/absen", (req, res) => {
  const { guruId, status, lat, lng } = req.body;

  if (hariIniMinggu()) {
    return res
      .status(400)
      .json({ error: "Absensi tidak dibuka pada hari Minggu" });
  }
  if (!guruId || !status) {
    return res.status(400).json({ error: "Data belum lengkap" });
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res
      .status(400)
      .json({ error: "Lokasi tidak terdeteksi. Aktifkan GPS/lokasi." });
  }

  const jarak = hitungJarakMeter(SEKOLAH_LAT, SEKOLAH_LNG, lat, lng);
  // --- SEMENTARA DIMATIKAN UNTUK TESTING ---
  // if (jarak > RADIUS_METER) {
  //   return res.status(403).json({
  //     error: `Kamu berada ${Math.round(jarak)} m dari sekolah. Absen hanya bisa dilakukan dalam radius ${RADIUS_METER} m.`
  //   });
  // }

  // SESUDAH
  const db = bacaDb();
  const guru = getGuru().find((g) => g.id === guruId);
  if (!guru) return res.status(404).json({ error: "Guru tidak ditemukan" });

  const tanggal = tanggalHariIni();
  const sudahAbsen = db.absensi.find(
    (a) => a.guruId === guruId && a.tanggal === tanggal,
  );
  if (sudahAbsen) {
    return res
      .status(409)
      .json({ error: "Kamu sudah absen hari ini", absensiId: sudahAbsen.id });
  }

  const record = {
    id: db.nextAbsensiId++,
    guruId,
    namaGuru: guru.nama,
    tanggal,
    waktu: waktuSekarang(),
    status,
    lat,
    lng,
    jarakMeter: Math.round(jarak),
    mengajar: [],
  };
  db.absensi.push(record);
  simpanDb(db);

  res.json({
    ok: true,
    absensiId: record.id,
    bisaMengajar: guru.bisaMengajar,
    mapelGuru: guru.mapel,
    kelas: db.kelas,
    jam: db.jam,
  });
});

// Tambah 1 entri "absen mengajar" ke absensi kehadiran yang sudah ada
app.post("/api/absen-mengajar", (req, res) => {
  const { absensiId, mapel, kelas, jam } = req.body;
  if (!absensiId || !mapel || !kelas || !jam) {
    return res.status(400).json({ error: "Data mengajar belum lengkap" });
  }
  const db = bacaDb();
  const absensi = db.absensi.find((a) => a.id === absensiId);
  if (!absensi)
    return res
      .status(404)
      .json({ error: "Data absen kehadiran tidak ditemukan" });

  absensi.mengajar.push({ mapel, kelas, jam, waktu: waktuSekarang() });
  simpanDb(db);
  res.json({ ok: true, mengajar: absensi.mengajar });
});

// ---------- API Admin ----------

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Password salah" });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/cek-login", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// Rekap absensi, bisa difilter ?dari=YYYY-MM-DD&sampai=YYYY-MM-DD
app.get("/api/admin/rekap", wajibAdmin, (req, res) => {
  const db = bacaDb();
  let data = db.absensi;
  const { dari, sampai } = req.query;
  if (dari) data = data.filter((a) => a.tanggal >= dari);
  if (sampai) data = data.filter((a) => a.tanggal <= sampai);
  data = [...data].sort((a, b) =>
    a.tanggal + a.waktu < b.tanggal + b.waktu ? 1 : -1,
  );
  res.json({ data, guru: db.guru });
});

// Export CSV rekap
app.get("/api/admin/export-csv", wajibAdmin, (req, res) => {
  const db = bacaDb();
  const { dari, sampai } = req.query;
  let data = db.absensi;
  if (dari) data = data.filter((a) => a.tanggal >= dari);
  if (sampai) data = data.filter((a) => a.tanggal <= sampai);

  const baris = ["Tanggal,Waktu,Nama Guru,Status,Jarak (m),Mapel Diajar"];
  data.forEach((a) => {
    const mapelStr = a.mengajar
      .map((m) => `${m.mapel} ${m.kelas} (${m.jam})`)
      .join(" | ");
    baris.push(
      [
        a.tanggal,
        a.waktu,
        `"${a.namaGuru}"`,
        a.status,
        a.jarakMeter,
        `"${mapelStr}"`,
      ].join(","),
    );
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=rekap-absensi.csv",
  );
  res.send(baris.join("\n"));
});

app.listen(PORT, () => {
  console.log(`Server absensi guru jalan di http://localhost:${PORT}`);
});
