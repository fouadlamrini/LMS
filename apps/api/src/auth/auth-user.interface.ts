export interface AuthUser {
  id: string;
  email: string;
  role: 'trainer' | 'learner' | 'admin';
}
