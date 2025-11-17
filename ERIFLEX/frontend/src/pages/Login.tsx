import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // protect useAuth so the page won't crash if AuthProvider is not mounted
  let signIn: (email: string, password: string) => Promise<{ error: any }> = async () => ({ error: 'No auth' });
  let signUp: (email: string, password: string) => Promise<{ error: any }> = async () => ({ error: 'No auth' });
  let authAvailable = true;
  try {
    const auth = useAuth();
    signIn = auth.signIn;
    signUp = auth.signUp;
  } catch (e) {
    authAvailable = false;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!authAvailable) {
        setError('AuthProvider chưa được cấu hình - hãy bọc App bằng AuthProvider');
        setLoading(false);
        return;
      }
      if (isSignUp) {
        // AuthContext.signUp no longer accepts full name; call with email & password
        const { error } = await signUp(email, password);
        if (error) {
          setError(typeof error === 'string' ? error : (error?.message || 'Đăng ký thất bại'));
        } else {
          setError('');
          alert('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsSignUp(false);
          setEmail('');
          setPassword('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError('Email hoặc mật khẩu không đúng');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
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
                isSignUp ? 'Đăng ký' : 'Đăng nhập'
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-blue-600 hover:underline"
              >
                {isSignUp
                  ? 'Đã có tài khoản? Đăng nhập'
                  : 'Chưa có tài khoản? Đăng ký'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
