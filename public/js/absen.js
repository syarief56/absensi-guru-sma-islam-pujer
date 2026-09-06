let dataAwal = null;
let lokasiSaya = null;
let statusTerpilih = null;
let absensiIdAktif = null;
let daftarMengajarTampil = [];

const MAPEL_TANPA_KELAS = ["BTQ", "Kokurikuler", "Desain Grafis"];
const MAPEL_TANPA_KELAS_DAN_JAM = ["Piket"];

const el = (id) => document.getElementById(id);
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

async function muatData() {
  const res = await fetch("/api/guru");
  dataAwal = await res.json();

  if (dataAwal.hariMinggu) {
    el("kartu-lokasi").innerHTML =
      '<h2>Absensi tidak dibuka</h2><div class="status-box gagal">Hari ini Minggu. Absensi hanya dibuka Senin sampai Sabtu.</div>';
    return;
  }

  const selectGuru = el("pilih-guru");
  selectGuru.innerHTML =
    '<option value="">-- Pilih nama --</option>' +
    dataAwal.guru
      .map((g) => `<option value="${g.id}">${g.nama} (${g.jabatan})</option>`)
      .join("");
}

el("btn-cek-lokasi").addEventListener("click", () => {
  const box = el("lokasi-status");
  box.className = "status-box info";
  box.textContent = "Mencari lokasi kamu...";

  if (!navigator.geolocation) {
    box.className = "status-box gagal";
    box.textContent = "HP/browser ini tidak mendukung deteksi lokasi.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const jarak = hitungJarakMeter(
        dataAwal.sekolahLat,
        dataAwal.sekolahLng,
        lat,
        lng,
      );

      if (jarak > dataAwal.radiusMeter) {
        box.className = "status-box gagal";
        box.textContent = `Kamu berada sekitar ${Math.round(jarak)} m dari sekolah. Absen hanya bisa dilakukan dalam radius ${dataAwal.radiusMeter} m.`;
        lokasiSaya = null;
        return;
      }

      lokasiSaya = { lat, lng };
      box.className = "status-box sukses";
      box.textContent =
        "Lokasi berhasil dideteksi. Silakan lanjut isi absensi.";
      el("kartu-kehadiran").style.display = "block";
    },
    (err) => {
      box.className = "status-box gagal";
      box.textContent =
        "Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan, lalu coba lagi.";
    },
    { enableHighAccuracy: true, timeout: 12000 },
  );
});

document.querySelectorAll(".pilihan-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".pilihan-btn")
      .forEach((b) => b.classList.remove("aktif"));
    btn.classList.add("aktif");
    statusTerpilih = btn.dataset.status;
    cekTombolAbsenAktif();
  });
});

el("pilih-guru").addEventListener("change", cekTombolAbsenAktif);

function cekTombolAbsenAktif() {
  const guruId = el("pilih-guru").value;
  el("btn-absen").disabled = !(guruId && statusTerpilih && lokasiSaya);
}

el("btn-absen").addEventListener("click", async () => {
  const guruId = parseInt(el("pilih-guru").value, 10);
  const statusBox = el("absen-status");
  el("btn-absen").disabled = true;
  statusBox.innerHTML =
    '<div class="status-box tunggu">Mengirim absensi...</div>';

  try {
    const res = await fetch("/api/absen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guruId,
        status: statusTerpilih,
        lat: lokasiSaya.lat,
        lng: lokasiSaya.lng,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      statusBox.innerHTML = `<div class="status-box gagal">${data.error}</div>`;
      el("btn-absen").disabled = false;
      return;
    }

    absensiIdAktif = data.absensiId;
    statusBox.innerHTML =
      '<div class="status-box sukses">Absen kehadiran tersimpan.</div>';

    if (data.bisaMengajar) {
      siapkanFormMengajar(data.mapelGuru, data.kelas, data.jam);
      el("kartu-mengajar").style.display = "block";
    } else {
      tampilkanSelesai();
    }
  } catch (e) {
    statusBox.innerHTML =
      '<div class="status-box gagal">Terjadi kesalahan koneksi. Coba lagi.</div>';
    el("btn-absen").disabled = false;
  }
});

function siapkanFormMengajar(mapelGuru, kelas, jam) {
  el("pilih-mapel").innerHTML = mapelGuru
    .map((m) => `<option value="${m}">${m}</option>`)
    .join("");
  el("pilih-kelas").innerHTML = kelas
    .map((k) => `<option value="${k}">${k}</option>`)
    .join("");
  el("pilih-jam").innerHTML = jam
    .map((j) => `<option value="${j}">${j}</option>`)
    .join("");
  perbaruiTampilanMengajar();
}

el("pilih-mapel").addEventListener("change", perbaruiTampilanMengajar);

function perbaruiTampilanMengajar() {
  const mapel = el("pilih-mapel").value;
  const tanpaJam = MAPEL_TANPA_KELAS_DAN_JAM.includes(mapel);
  const tanpaKelas = tanpaJam || MAPEL_TANPA_KELAS.includes(mapel);

  el("grup-kelas").style.display = tanpaKelas ? "none" : "block";
  el("grup-jam").style.display = tanpaJam ? "none" : "block";
}

el("btn-tambah-mengajar").addEventListener("click", async () => {
  const mapel = el("pilih-mapel").value;
  const tanpaJam = MAPEL_TANPA_KELAS_DAN_JAM.includes(mapel);
  const tanpaKelas = tanpaJam || MAPEL_TANPA_KELAS.includes(mapel);
  const kelas = tanpaKelas ? "-" : el("pilih-kelas").value;
  const jam = tanpaJam ? "-" : el("pilih-jam").value;

  const res = await fetch("/api/absen-mengajar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ absensiId: absensiIdAktif, mapel, kelas, jam }),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Gagal menyimpan data mengajar");
    return;
  }
  daftarMengajarTampil = data.mengajar;
  renderDaftarMengajar();
});

function formatMengajar(m) {
  let teks = m.mapel;
  if (m.kelas !== "-") teks += ` &middot; ${m.kelas}`;
  if (m.jam !== "-") teks += ` &middot; jam ${m.jam}`;
  return teks;
}

function renderDaftarMengajar() {
  el("daftar-mengajar").innerHTML = daftarMengajarTampil
    .map((m) => `<span class="tag-mengajar">${formatMengajar(m)}</span>`)
    .join("");
}

el("btn-selesai").addEventListener("click", tampilkanSelesai);

function tampilkanSelesai() {
  el("kartu-kehadiran").style.display = "none";
  el("kartu-mengajar").style.display = "none";
  el("kartu-selesai").style.display = "block";

  const namaGuru = el("pilih-guru").selectedOptions[0]
    ? el("pilih-guru").selectedOptions[0].textContent
    : "";

  let ringkasan = `<b>Nama:</b> ${namaGuru}<br/><b>Status:</b> ${statusTerpilih}`;
  if (daftarMengajarTampil.length > 0) {
    ringkasan +=
      `<br/><b>Mengajar:</b><br/>` +
      daftarMengajarTampil.map((m) => `- ${formatMengajar(m)}`).join("<br/>");
  }
  el("ringkasan-akhir").innerHTML = ringkasan;
}

muatData();
