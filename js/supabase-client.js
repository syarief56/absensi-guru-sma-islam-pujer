// Ganti dua nilai di bawah ini dengan punya kamu sendiri.
// Ambil dari Supabase: menu Project Settings -> API
//   - "Project URL"      -> SUPABASE_URL
//   - "anon public" key  -> SUPABASE_ANON_KEY  (BUKAN "service_role", itu rahasia dan tidak boleh ditaruh di sini)

const SUPABASE_URL = "sb_publishable_Tb7rUeLHLPoDbYo1cmsk6A_2JLHLupq";
const SUPABASE_ANON_KEY = "sb_secret_PbfULm5y1GBxh4pIUTwcFA_mQqU52cE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);