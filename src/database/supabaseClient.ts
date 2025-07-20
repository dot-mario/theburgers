// src/database/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Supabase URL과 키는 환경변수에서 가져와야 합니다
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 클라이언트용 (RLS 적용)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 서버용 (RLS 우회)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 연결 테스트 함수
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('detection_groups')
      .select('count()')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}