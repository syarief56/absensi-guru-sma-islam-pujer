const fs = require("fs");
const path = require("path");
const { guruAwal, kelasAwal, jamAwal } = require("./seed-data");

const DB_PATH = path.join(__dirname, "data", "db.json");

function buatDbAwal() {
  const data = {
    guru: guruAwal.map((g, i) => ({ id: i + 1, ...g })),
    kelas: kelasAwal,
    jam: jamAwal,
    absensi: [], // { id, guruId, tanggal, waktu, status, lat, lng, jarakMeter, mengajar: [{mapel, kelas, jam}] }
    nextAbsensiId: 1
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  return data;
}

function bacaDb() {
  if (!fs.existsSync(DB_PATH)) {
    return buatDbAwal();
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function simpanDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { bacaDb, simpanDb };
