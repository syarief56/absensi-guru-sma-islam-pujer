// Versi statis: login admin pakai Supabase Auth (email + password),
// bukan password tunggal seperti dulu. Rekap & hapus data langsung lewat
// Supabase (diizinkan karena akun admin sudah dicocokkan lewat aturan
// keamanan/RLS yang dipasang di database).

const el = (id) => document.getElementById(id);

async function cekLogin() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    tampilkanAdmin();
  }
}

el("btn-login").addEventListener("click", async () => {
  const email = el("email-admin").value.trim();
  const password = el("password-admin").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    el("login-status").innerHTML =
      `<div class="status-box gagal">${error.message}</div>`;
    return;
  }
  tampilkanAdmin();
});

el("btn-logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

function tampilkanAdmin() {
  el("area-login").style.display = "none";
  el("area-admin").style.display = "block";
  muatRekap();
}

el("btn-filter").addEventListener("click", muatRekap);

el("btn-export").addEventListener("click", async () => {
  const data = await ambilRekap();
  const baris = ["Tanggal,Waktu,Nama Guru,Status,Jarak (m),Mapel Diajar"];
  data.forEach((a) => {
    const mapelStr = (a.mengajar || []).map(formatMengajarEntry).join(" | ");
    baris.push(
      [a.tanggal, a.waktu, `"${a.nama_guru}"`, a.status, a.jarak_meter, `"${mapelStr}"`].join(","),
    );
  });

  const blob = new Blob([baris.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rekap-absensi.csv";
  a.click();
  URL.revokeObjectURL(url);
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
  if (m.tipe === "dinas") return `Dinas: ${m.tujuan} (${m.keperluan})`;
  if (m.kelas && m.jam) return `${m.mapel} ${m.kelas} (jam ${m.jam})`;
  if (m.jam) return `${m.mapel} (jam ${m.jam})`;
  return `${m.mapel}`;
}

function barisRekap(a) {
  const mengajarStr = (a.mengajar || []).length
    ? a.mengajar.map(formatMengajarEntry).join(", ")
    : "-";
  return `<tr>
    <td>${a.tanggal}</td>
    <td>${a.waktu}</td>
    <td>${a.nama_guru}</td>
    <td>${badgeStatus(a.status)}</td>
    <td>${a.jarak_meter}</td>
    <td>${mengajarStr}</td>
    <td><button class="btn-hapus" data-id="${a.id}">Hapus</button></td>
  </tr>`;
}

async function ambilRekap() {
  const dari = el("filter-dari").value;
  const sampai = el("filter-sampai").value;

  let query = supabase.from("absensi").select("*");
  if (dari) query = query.gte("tanggal", dari);
  if (sampai) query = query.lte("tanggal", sampai);
  query = query.order("tanggal", { ascending: false }).order("waktu", { ascending: false });

  const { data, error } = await query;
  if (error) {
    alert("Gagal mengambil rekap: " + error.message);
    return [];
  }
  return data || [];
}

async function muatRekap() {
  const data = await ambilRekap();
  const container = el("rekap-container");
  if (data.length === 0) {
    container.innerHTML =
      '<div class="card" style="text-align:center;color:var(--teks-lembut);">Belum ada data</div>';
    return;
  }
  const grup = kelompokkanPerTanggal(data);
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
      const { error } = await supabase.from("absensi").delete().eq("id", btn.dataset.id);
      if (!error) {
        muatRekap();
      } else {
        alert("Gagal menghapus data: " + error.message);
      }
    });
  });
}

cekLogin();