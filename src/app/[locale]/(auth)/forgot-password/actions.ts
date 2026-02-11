'use server';

import { supabase } from '@/lib/supabase';

// Send OTP using Supabase's built-in signInWithOtp
// This will send a 6-digit code (if email template is configured) or a magic link
export async function sendPasswordResetOTP(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Geçerli bir e-posta adresi girin' };
  }

  try {
    // Use Supabase's signInWithOtp - this sends an email with a code/link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      return { error: error.message || 'OTP gönderilemedi' };
    }

    return { success: true, message: 'OTP kodu gönderildi!' };
  } catch (error) {
    console.error('Send OTP error:', error);
    return { error: 'OTP gönderilemedi' };
  }
}

// Verify OTP and update password
export async function resetPasswordWithOTP(formData: FormData) {
  const email = formData.get('email') as string;
  const otpCode = formData.get('otp') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !otpCode || !newPassword || !confirmPassword) {
    return { error: 'Tüm alanlar gerekli' };
  }

  if (otpCode.length !== 8) {
    return { error: 'OTP 8 haneli olmalı' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Şifreler eşleşmiyor' };
  }

  if (newPassword.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalı' };
  }

  try {
    // First verify OTP and sign in
    const { data: signInData, error: signInError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });

    if (signInError || !signInData.user) {
      return { error: 'Geçersiz veya süresi dolmuş OTP kodu' };
    }

    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { error: 'Şifre güncellenemedi' };
    }

    return { success: true, message: 'Şifre başarıyla sıfırlandı!' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: 'Şifre sıfırlanamadı' };
  }
}
