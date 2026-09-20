const el = (id) => document.getElementById(id);
async function cekLogin() {
  const res = await fetch("/api/admin/cek-login");
  const data = await res.json();
  if (data.isAdmin) {
    tampilkanAdmin();
  }
}
el("btn-login").addEventListener("click", async () => {
  const password = el("password-admin").value;
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) {
    el("login-status").innerHTML =
      `<div class="status-box gagal">${data.error}</div>`;
    return;
  }
  tampilkanAdmin();
});
el("btn-logout").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  location.reload();
});
function tampilkanAdmin() {
  el("area-login").style.display = "none";
  el("area-admin").style.display = "block";
  muatRekap();
}
el("btn-filter").addEventListener("click", muatRekap);
el("btn-export").addEventListener("click", () => {
  const dari = el("filter-dari").value;
  const sampai = el("filter-sampai").value;
  const q = new URLSearchParams();
  if (dari) q.set("dari", dari);
  if (sampai) q.set("sampai", sampai);
  window.location.href = "/api/admin/export-csv?" + q.toString();
});
function badgeStatus(status) {
  const kelas =
    {
      Hadir: "badge-hadir",
      Izin: "badge-izin",
      Sakit: "badge-sakit",
      Alpa: "badge-alpa",
    }[status] || "badge-hadir";
  return `<span class="badge ${kelas}">${status}</span>`;
}
function kelompokkanPerTanggal(data) {
  const grup = {};
  data.forEach((a) => {
    if (!grup[a.tanggal]) grup[a.tanggal] = [];
    grup[a.tanggal].push(a);
  });
  return grup;
}
function formatMengajarEntry(m) {
  if (m.tipe === "dinas") {
    return `Dinas: ${m.tujuan} (${m.keperluan})`;
  }
  if (m.kelas && m.jam) {
    return `${m.mapel} ${m.kelas} (jam ${m.jam})`;
  }
  if (m.jam) {
    return `${m.mapel} (jam ${m.jam})`;
  }
  return `${m.mapel}`;
}
function barisRekap(a) {
  const mengajarStr = a.mengajar.length
    ? a.mengajar.map(formatMengajarEntry).join(", ")
    : "-";
  return `<tr>
    <td>${a.tanggal}</td>
    <td>${a.waktu}</td>
    <td>${a.namaGuru}</td>
    <td>${badgeStatus(a.status)}</td>
    <td>${a.jarakMeter}</td>
    <td>${mengajarStr}</td>
    <td><button class="btn-hapus" data-id="${a.id}">Hapus</button></td>
  </tr>`;
}
async function muatRekap() {
  const dari = el("filter-dari").value;
  const sampai = el("filter-sampai").value;
  const q = new URLSearchParams();
  if (dari) q.set("dari", dari);
  if (sampai) q.set("sampai", sampai);
  const res = await fetch("/api/admin/rekap?" + q.toString());
  const data = await res.json();
  const container = el("rekap-container");
  if (data.data.length === 0) {
    container.innerHTML =
      '<div class="card" style="text-align:center;color:var(--teks-lembut);">Belum ada data</div>';
    return;
  }
  const grup = kelompokkanPerTanggal(data.data);
  const tanggalUrut = Object.keys(grup).sort().reverse();
  container.innerHTML = tanggalUrut
    .map((tgl) => {
      const baris = grup[tgl].map(barisRekap).join("");
      return `
        <div class="card" style="margin-bottom:20px;">
          <h3 style="margin:0 0 10px;color:var(--hijau-tua);">${tgl}</h3>
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Nama guru</th>
                  <th>Status</th>
                  <th>Jarak (m)</th>
                  <th>Mengajar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>${baris}</tbody>
            </table>
          </div>
        </div>
      `;
    })
    .join("");
  document.querySelectorAll(".btn-hapus").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Yakin mau hapus data absensi ini?")) return;
      const res = await fetch("/api/admin/rekap/" + btn.dataset.id, {
        method: "DELETE",
      });
      if (res.ok) {
        muatRekap();
      } else {
        alert("Gagal menghapus data");
      }
    });
  });
}
cekLogin();
