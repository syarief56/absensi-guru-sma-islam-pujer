require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const {
  getGuru,
  getKelas,
  getJam,
  cariAbsensiHariIni,
  tambahAbsensi,
  tambahMengajar,
  getRekap,
  hapusAbsensi,
} = require("./db");

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
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  }),
);

function hitungJarakMeter(lat1, lng1, lat2, lng2) {
  const R = 6371000;
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
  const tz = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return tz.toISOString().slice(0, 10);
}

function waktuSekarang() {
  const d = new Date();
  const tz = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return tz.toISOString().slice(11, 16);
}

function hariIniMinggu() {
  return false;
}

function wajibAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Belum login sebagai admin" });
}

// ---------- API untuk halaman absen ----------

app.get("/api/guru", (req, res) => {
  const daftar = getGuru().map((g) => ({
    id: g.id,
    nama: g.nama,
    jabatan: g.jabatan,
    mapel: g.mapel,
    bisaMengajar: g.bisaMengajar,
  }));
  res.json({
    guru: daftar,
    kelas: getKelas(),
    jam: getJam(),
    hariMinggu: hariIniMinggu(),
    tanggalHariIni: tanggalHariIni(),
    sekolahLat: SEKOLAH_LAT,
    sekolahLng: SEKOLAH_LNG,
    radiusMeter: RADIUS_METER,
  });
});

app.post("/api/absen", async (req, res) => {
  try {
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

    const guru = getGuru().find((g) => g.id === guruId);
    if (!guru) return res.status(404).json({ error: "Guru tidak ditemukan" });

    const tanggal = tanggalHariIni();
    const sudahAbsen = await cariAbsensiHariIni(guruId, tanggal);
    if (sudahAbsen) {
      return res
        .status(409)
        .json({ error: "Kamu sudah absen hari ini", absensiId: sudahAbsen.id });
    }

    const record = await tambahAbsensi({
      guruId,
      namaGuru: guru.nama,
      tanggal,
      waktu: waktuSekarang(),
      status,
      lat,
      lng,
      jarakMeter: Math.round(jarak),
    });

    res.json({
      ok: true,
      absensiId: record.id,
      bisaMengajar: guru.bisaMengajar,
      mapelGuru: guru.mapel,
      kelas: getKelas(),
      jam: getJam(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan absensi" });
  }
});

app.post("/api/absen-mengajar", async (req, res) => {
  try {
    const { absensiId, mapel, kelas, jam } = req.body;
    if (!absensiId || !mapel || !kelas || !jam) {
      return res.status(400).json({ error: "Data mengajar belum lengkap" });
    }
    const hasil = await tambahMengajar(absensiId, {
      mapel,
      kelas,
      jam,
      waktu: waktuSekarang(),
    });
    if (!hasil)
      return res
        .status(404)
        .json({ error: "Data absen kehadiran tidak ditemukan" });
    res.json({ ok: true, mengajar: hasil.mengajar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan data mengajar" });
  }
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

app.get("/api/admin/rekap", wajibAdmin, async (req, res) => {
  try {
    const { dari, sampai } = req.query;
    const data = await getRekap(dari, sampai);
    res.json({ data, guru: getGuru() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil rekap" });
  }
});

app.delete("/api/admin/rekap/:id", wajibAdmin, async (req, res) => {
  try {
    await hapusAbsensi(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus data" });
  }
});

app.get("/api/admin/export-csv", wajibAdmin, async (req, res) => {
  try {
    const { dari, sampai } = req.query;
    const data = await getRekap(dari, sampai);

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal export CSV" });
  }
});

app.listen(PORT, () => {
  console.log(`Server absensi guru jalan di http://localhost:${PORT}`);
});
