// Versi statis: langsung bicara ke Supabase (lewat fungsi absen_hadir & tambah_mengajar
// yang sudah dipasang di database), tidak lagi lewat server.

let dataAwal = null;
let lokasiSaya = null;
let statusTerpilih = null;
let absensiIdAktif = null;
let daftarMengajarTampil = [];
let tipeTambahanAktif = "mengajar";

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

function muatData() {
  const s = window.SEED_DATA;
  dataAwal = {
    guru: s.getGuru(),
    kelas: s.kelasAwal,
    jam: s.jamAwal,
    sekolahLat: s.SEKOLAH_LAT,
    sekolahLng: s.SEKOLAH_LNG,
    radiusMeter: s.RADIUS_METER,
    tanpaKelasDanJam: s.TANPA_KELAS_DAN_JAM,
    tanpaKelas: s.TANPA_KELAS,
  };

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
        box.textContent = `Kamu berada ${Math.round(jarak)} m dari sekolah. Absen hanya bisa dilakukan dalam radius ${dataAwal.radiusMeter} m.`;
        el("kartu-kehadiran").style.display = "none";
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

document.querySelectorAll("#pilihan-status .pilihan-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("#pilihan-status .pilihan-btn")
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

  const guru = dataAwal.guru.find((g) => g.id === guruId);

  const { data, error } = await supabase.rpc("absen_hadir", {
    p_guru_id: guruId,
    p_nama_guru: guru ? guru.nama : "",
    p_status: statusTerpilih,
    p_lat: lokasiSaya.lat,
    p_lng: lokasiSaya.lng,
  });

  if (error) {
    statusBox.innerHTML = `<div class="status-box gagal">${error.message}</div>`;
    el("btn-absen").disabled = false;
    return;
  }

  absensiIdAktif = data.absensi_id;
  statusBox.innerHTML =
    '<div class="status-box sukses">Absen kehadiran tersimpan.</div>';

  if (guru && guru.bisaMengajar) {
    siapkanFormMengajar(guru.mapel, dataAwal.kelas, dataAwal.jam);
    el("kartu-mengajar").style.display = "block";
  } else {
    tampilkanSelesai();
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
  updateTampilanMapel();
}

function updateTampilanMapel() {
  const mapel = el("pilih-mapel").value;
  const tanpaKelasDanJam = (dataAwal.tanpaKelasDanJam || []).includes(mapel);
  const tanpaKelas = (dataAwal.tanpaKelas || []).includes(mapel);

  el("wrap-kelas").style.display =
    tanpaKelasDanJam || tanpaKelas ? "none" : "block";
  el("wrap-jam").style.display = tanpaKelasDanJam ? "none" : "block";
}

el("pilih-mapel").addEventListener("change", updateTampilanMapel);

document
  .querySelectorAll("#pilihan-tipe-tambahan .pilihan-btn")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#pilihan-tipe-tambahan .pilihan-btn")
        .forEach((b) => b.classList.remove("aktif"));
      btn.classList.add("aktif");
      tipeTambahanAktif = btn.dataset.tipe;

      if (tipeTambahanAktif === "mengajar") {
        el("grup-mengajar").style.display = "block";
        el("grup-dinas").style.display = "none";
        updateTampilanMapel();
      } else {
        el("grup-mengajar").style.display = "none";
        el("grup-dinas").style.display = "block";
      }
    });
  });

el("btn-tambah-mengajar").addEventListener("click", async () => {
  let entry = { tipe: tipeTambahanAktif };

  if (tipeTambahanAktif === "mengajar") {
    const mapel = el("pilih-mapel").value;
    if (!mapel) {
      alert("Pilih mapel dulu");
      return;
    }

    const tanpaKelasDanJam = (dataAwal.tanpaKelasDanJam || []).includes(mapel);
    const tanpaKelas = (dataAwal.tanpaKelas || []).includes(mapel);

    if (tanpaKelasDanJam) {
      entry = { ...entry, mapel };
    } else if (tanpaKelas) {
      const jam = el("pilih-jam").value;
      if (!jam) {
        alert("Pilih jam dulu");
        return;
      }
      entry = { ...entry, mapel, jam };
    } else {
      const kelas = el("pilih-kelas").value;
      const jam = el("pilih-jam").value;
      if (!kelas || !jam) {
        alert("Lengkapi kelas dan jam dulu");
        return;
      }
      entry = { ...entry, mapel, kelas, jam };
    }
  } else {
    const tujuan = el("input-tujuan-dinas").value.trim();
    const keperluan = el("input-keperluan-dinas").value.trim();
    if (!tujuan || !keperluan) {
      alert("Isi tujuan dan keperluan dinas dulu");
      return;
    }
    entry = { ...entry, tujuan, keperluan };
  }

  const { data, error } = await supabase.rpc("tambah_mengajar", {
    p_absensi_id: absensiIdAktif,
    p_entry: entry,
  });

  if (error) {
    alert(error.message || "Gagal menyimpan data");
    return;
  }

  daftarMengajarTampil = data.mengajar;
  renderDaftarMengajar();

  if (tipeTambahanAktif === "dinas") {
    el("input-tujuan-dinas").value = "";
    el("input-keperluan-dinas").value = "";
  }
});

function formatMengajarTampil(m) {
  if (m.tipe === "dinas") {
    return `Dinas &middot; ${m.tujuan} &middot; ${m.keperluan}`;
  }
  if (m.kelas && m.jam) {
    return `${m.mapel} &middot; ${m.kelas} &middot; jam ${m.jam}`;
  }
  if (m.jam) {
    return `${m.mapel} &middot; jam ${m.jam}`;
  }
  return `${m.mapel}`;
}

function renderDaftarMengajar() {
  el("daftar-mengajar").innerHTML = daftarMengajarTampil
    .map((m) => `<span class="tag-mengajar">${formatMengajarTampil(m)}</span>`)
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
      `<br/><b>Data tambahan:</b><br/>` +
      daftarMengajarTampil
        .map((m) => `- ${formatMengajarTampil(m).replace(/&middot;/g, "·")}`)
        .join("<br/>");
  }
  el("ringkasan-akhir").innerHTML = ringkasan;
}

muatData();