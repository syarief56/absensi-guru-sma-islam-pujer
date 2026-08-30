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
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) {
    el("login-status").innerHTML = `<div class="status-box gagal">${data.error}</div>`;
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
    { Hadir: "badge-hadir", Izin: "badge-izin", Sakit: "badge-sakit", Alpa: "badge-alpa" }[status] ||
    "badge-hadir";
  return `<span class="badge ${kelas}">${status}</span>`;
}

async function muatRekap() {
  const dari = el("filter-dari").value;
  const sampai = el("filter-sampai").value;
  const q = new URLSearchParams();
  if (dari) q.set("dari", dari);
  if (sampai) q.set("sampai", sampai);

  const res = await fetch("/api/admin/rekap?" + q.toString());
  const data = await res.json();

  el("tabel-rekap").innerHTML = data.data
    .map((a) => {
      const mengajarStr = a.mengajar.length
        ? a.mengajar.map((m) => `${m.mapel} ${m.kelas} (jam ${m.jam})`).join(", ")
        : "-";
      return `<tr>
        <td>${a.tanggal}</td>
        <td>${a.waktu}</td>
        <td>${a.namaGuru}</td>
        <td>${badgeStatus(a.status)}</td>
        <td>${a.jarakMeter}</td>
        <td>${mengajarStr}</td>
      </tr>`;
    })
    .join("");

  if (data.data.length === 0) {
    el("tabel-rekap").innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--teks-lembut);">Belum ada data</td></tr>';
  }
}

cekLogin();
