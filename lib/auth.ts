import bcrypt from 'bcryptjs';
import { supabaseServer } from './db';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminUser(
  username: string,
  password: string
): Promise<{ id: string; username: string } | null> {
  try {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabaseServer
      .from('admin_users')
      .insert({
        username,
        password_hash: passwordHash,
      })
      .select('id, username')
      .single();

    if (error) {
      console.error('Error creating admin user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Create admin user error:', error);
    return null;
  }
}

export async function verifyAdminUser(
  username: string,
  password: string
): Promise<{ id: string; username: string } | null> {
  try {
    const { data, error } = await supabaseServer
      .from('admin_users')
      .select('id, username, password_hash')
      .eq('username', username)
      .single();

    if (error || !data) {
      return null;
    }

    const isValid = await verifyPassword(password, data.password_hash);

    if (!isValid) {
      return null;
    }

    return { id: data.id, username: data.username };
  } catch (error) {
    console.error('Verify admin user error:', error);
    return null;
  }
}
