import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap } from 'lucide-react';
import RegistrationForm from '@/components/RegistrationForm';
import { login } from '../api/api';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Try to get setUser from context, but don't rely on it
  const auth = useAuth() as any;
  const setUser = auth?.setUser;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(registrationNumber, password);
      if (res.ok) {
        // Persist user session to localStorage
        localStorage.setItem('user', JSON.stringify(res.data));

        if (typeof setUser === 'function') {
          setUser(res.data);
        } else {
          // Fallback: force reload to pick up localStorage in App.tsx
          window.location.href = '/';
        }
      } else {
        setError(res.data?.detail || 'Mã số thuế hoặc mật khẩu không đúng');
      }
    } catch (err: any) {
      setError('Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4">
      <Card className={`w-full ${isSignUp ? 'max-w-4xl' : 'max-w-md'}`}>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập'}
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Electrical Engineering Suite
          </p>
        </CardHeader>
        <CardContent>
          {isSignUp ? (
            <>
              <RegistrationForm
                onSuccess={(data) => {
                  setIsSignUp(false);
                  setError('');
                  if (data?.registration_number) setRegistrationNumber(data.registration_number);
                }}
                onCancel={() => {
                  setIsSignUp(false);
                  setError('');
                }}
              />
              <div className="text-center text-sm mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                  }}
                  className="text-blue-600 hover:underline"
                  disabled={loading}
                >
                  Đã có tài khoản? Đăng nhập
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Tên đăng nhập (Mã số thuế)</Label>
                <Input
                  id="registrationNumber"
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Nhập mã số thuế công ty"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Chưa có tài khoản? Đăng ký
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
