const { createClient } = require("@supabase/supabase-js");
const { guruAwal, kelasAwal, jamAwal } = require("./seed-data");

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = require("ws");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

function getGuru() {
  return guruAwal.map((g, i) => {
    const mapel = g.bisaMengajar
      ? [...g.mapel, "Piket", "Mengajar DA/DAS"]
      : g.mapel;
    return { id: i + 1, ...g, mapel };
  });
}
function getKelas() {
  return kelasAwal;
}
function getJam() {
  return jamAwal;
}

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    guruId: row.guru_id,
    namaGuru: row.nama_guru,
    tanggal: row.tanggal,
    waktu: row.waktu,
    status: row.status,
    lat: row.lat,
    lng: row.lng,
    jarakMeter: row.jarak_meter,
    mengajar: row.mengajar || [],
    tujuanDinas: row.tujuan_dinas || null,
    keperluanDinas: row.keperluan_dinas || null,
  };
}

async function cariAbsensiHariIni(guruId, tanggal) {
  const { data, error } = await supabase
    .from("absensi")
    .select("*")
    .eq("guru_id", guruId)
    .eq("tanggal", tanggal)
    .maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

async function tambahAbsensi(record) {
  const { data, error } = await supabase
    .from("absensi")
    .insert({
      guru_id: record.guruId,
      nama_guru: record.namaGuru,
      tanggal: record.tanggal,
      waktu: record.waktu,
      status: record.status,
      lat: record.lat,
      lng: record.lng,
      jarak_meter: record.jarakMeter,
      mengajar: [],
      tujuan_dinas: record.tujuanDinas || null,
      keperluan_dinas: record.keperluanDinas || null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

async function getAbsensiById(id) {
  const { data, error } = await supabase
    .from("absensi")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

async function tambahMengajar(absensiId, entry) {
  const existing = await getAbsensiById(absensiId);
  if (!existing) return null;
  const mengajarBaru = [...existing.mengajar, entry];
  const { data, error } = await supabase
    .from("absensi")
    .update({ mengajar: mengajarBaru })
    .eq("id", absensiId)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

async function getRekap(dari, sampai) {
  let query = supabase.from("absensi").select("*");
  if (dari) query = query.gte("tanggal", dari);
  if (sampai) query = query.lte("tanggal", sampai);
  query = query
    .order("tanggal", { ascending: false })
    .order("waktu", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function hapusAbsensi(id) {
  const { error } = await supabase.from("absensi").delete().eq("id", id);
  if (error) throw error;
  return true;
}

module.exports = {
  getGuru,
  getKelas,
  getJam,
  cariAbsensiHariIni,
  tambahAbsensi,
  getAbsensiById,
  tambahMengajar,
  getRekap,
  hapusAbsensi,
};
