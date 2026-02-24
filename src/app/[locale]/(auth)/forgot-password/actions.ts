'use server';

import { createClient } from '@/lib/supabase/server';

// Send password reset email using Supabase's resetPasswordForEmail
// This sends an email with a link that contains a token for password reset
export async function sendPasswordResetOTP(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Geçerli bir e-posta adresi girin' };
  }

  try {
    const supabase = await createClient();

    // Use Supabase's resetPasswordForEmail - this sends a password reset email
    // The email will contain a link that redirects to /reset-password with a token
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error('Supabase password reset error:', error);
      return { error: error.message || 'Şifre sıfırlama e-postası gönderilemedi' };
    }

    return { success: true, message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!' };
  } catch (error) {
    console.error('Send password reset error:', error);
    return { error: 'Şifre sıfırlama e-postası gönderilemedi' };
  }
}

// Update password using the session from the reset link
export async function resetPasswordWithOTP(formData: FormData) {
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!newPassword || !confirmPassword) {
    return { error: 'Tüm alanlar gerekli' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Şifreler eşleşmiyor' };
  }

  if (newPassword.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalı' };
  }

  try {
    const supabase = await createClient();

    // Check if user has a valid session from the reset link
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Oturum geçersiz veya süresi dolmuş. Lütfen tekrar deneyin.' };
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return { error: 'Şifre güncellenemedi' };
    }

    return { success: true, message: 'Şifre başarıyla sıfırlandı!' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: 'Şifre sıfırlanamadı' };
  }
}
