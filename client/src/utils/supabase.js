(function () {

const supabaseUrl =  'https://unlyhqepviccgcsnwiqz.supabase.co';
const supabaseAnonKey =  'sb_publishable_RX7S3RXoviOiN7K5ma3VKQ_gmsMuwS5';

  window.supabaseClient = supabase.createClient(
    supabaseUrl,
    supabaseAnonKey
  );

})();