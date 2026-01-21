import api from './axios';
import { User } from '../types/user';

//
export interface CreateUserDTO {
  fullName: string;
  email: string;
  password: string;
  role: string;
  studentNumber?: number;
  birthDate?: string;
  specialization?: string;
  bio?: string;
}

export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData: CreateUserDTO): Promise<User> => {
  const response = await api.post<User>('/users', userData);
  return response.data;
};