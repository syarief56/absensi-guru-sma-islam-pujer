// Data guru awal SMA Islam Pujer.
// "mapel" = daftar mata pelajaran yang bisa dipilih guru ini saat absen mengajar.
// "bisaMengajar" = false artinya guru ini (misal Kepala Sekolah / Tata Usaha)
// tidak akan melihat form "absen mengajar", hanya absen kehadiran biasa.
// Kokurikuler otomatis ditambahkan ke semua guru yang bisaMengajar = true.

const KOKURIKULER = "Kokurikuler";

const guruAwal = [
  {
    nama: "Hesti Nurhayati, S.Si",
    jabatan: "Kepala Sekolah",
    mapel: [],
    bisaMengajar: false,
  },
  {
    nama: "Sulastri, S.Pd",
    jabatan: "Guru",
    mapel: ["Bahasa Inggris", "Bahasa Mandarin", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Lintang Ika Safitri, S.Pd",
    jabatan: "Guru",
    mapel: ["Penjas Orkes", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Dicky Ramadhan, S.Pd",
    jabatan: "Guru",
    mapel: ["Bahasa Indonesia", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Muhammad Sulis, S.Pd",
    jabatan: "Guru",
    mapel: ["PPKn", "PABP", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Dewiyatul Hasanah, S.Pd",
    jabatan: "Guru",
    mapel: ["Geografi", "Sosiologi", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Rofiqoh, S.Si",
    jabatan: "Guru",
    mapel: ["IPA", "Biologi", "Bahasa Arab", "BTQ", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Mochammad Falik Dhoirobi",
    jabatan: "Guru",
    mapel: ["TIK", "Bahasa Arab", "Desain Grafis", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Istianah",
    jabatan: "Guru",
    mapel: ["Ekonomi", "PKWU", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Erviyan Wahyu Permana, S.Pd",
    jabatan: "Guru",
    mapel: ["Matematika", "Seni Budaya", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Ilmiatin Hasanah, S.Sos",
    jabatan: "Guru",
    mapel: ["Sejarah", KOKURIKULER],
    bisaMengajar: true,
  },
  {
    nama: "Marzuki, S.Pd",
    jabatan: "Tata Usaha",
    mapel: [],
    bisaMengajar: false,
  },
];

const kelasAwal = ["X", "XI", "XII"];
const jamAwal = ["1-2", "3-4", "5-6", "7-8"];

module.exports = { guruAwal, kelasAwal, jamAwal, KOKURIKULER };
