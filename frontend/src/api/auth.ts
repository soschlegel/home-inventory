import axios from 'axios';
import type { AuthResponse } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>('/api/auth/register', { email, password, name });
  return data;
}
