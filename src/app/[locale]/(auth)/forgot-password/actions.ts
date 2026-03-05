'use server';

import { createClient } from '@/lib/supabase/server';

// Send password reset email using Supabase's resetPasswordForEmail
// This sends an email with a link that contains a token for password reset
export async function sendPasswordResetOTP(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { error: 'INVALID_EMAIL', errorType: 'invalidEmail' };
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
      return { error: 'SEND_FAILED', errorType: 'sendFailed' };
    }

    return { success: true, errorType: 'sendSuccess' };
  } catch (error) {
    console.error('Send password reset error:', error);
    return { error: 'SEND_FAILED', errorType: 'sendFailed' };
  }
}

// Update password using the session from the reset link
export async function resetPasswordWithOTP(formData: FormData) {
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!newPassword || !confirmPassword) {
    return { error: 'ALL_FIELDS_REQUIRED', errorType: 'allFieldsRequired' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'PASSWORDS_MISMATCH', errorType: 'passwordsMismatch' };
  }

  if (newPassword.length < 6) {
    return { error: 'PASSWORD_TOO_SHORT', errorType: 'passwordTooShort' };
  }

  try {
    const supabase = await createClient();

    // Check if user has a valid session from the reset link
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'SESSION_EXPIRED', errorType: 'sessionExpired' };
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return { error: 'UPDATE_FAILED', errorType: 'updateFailed' };
    }

    return { success: true, errorType: 'resetSuccess' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: 'RESET_FAILED', errorType: 'resetFailed' };
  }
}
