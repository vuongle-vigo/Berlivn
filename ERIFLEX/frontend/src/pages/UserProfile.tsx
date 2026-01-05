import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getUser, updateUser } from '../api/api';
import { Save, Key } from 'lucide-react';

const ACTIVITIES_OPTIONS = [
  'Sản xuất',
  'Thương mại',
  'Dịch vụ',
  'Xây dựng',
  'Công nghệ thông tin',
  'Giáo dục',
  'Y tế',
  'Khác'
];

const EMPLOYEE_COUNT_OPTIONS = [
  '0 đến 10',
  '11–50',
  '51–200',
  '200+'
];

const POSITION_OPTIONS = [
  'Nhân viên',
  'Quản lý',
  'Giám đốc',
  'Tổng giám đốc'
];

const COUNTRIES = [
  'Vietnam',
  'United States',
  'United Kingdom',
  'France',
  'Germany',
  'Japan',
  'South Korea',
  'Thailand',
  'Singapore',
  'Malaysia'
];

export default function UserProfile() {
  const { user: contextUser } = useAuth();
  
  // Resolve user from context or localStorage to ensure we have the ID even on refresh
  const user = useMemo(() => {
    if (contextUser) return contextUser;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [contextUser]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [profileData, setProfileData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    position: '',
    professionalAddress: '',
    postalCode: '',
    city: '',
    country: 'Vietnam',
    directPhone: '',
    mobilePhone: '',
  });

  const [companyData, setCompanyData] = useState({
    name: '',
    registrationNumber: '',
    activities: '',
    activitiesOther: '',
    employeeCount: '',
    phone: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await getUser(user.id);

      if (!res.ok) throw new Error('Failed to load profile');

      const data = res.data;
      if (data) {
        setProfileData({
          email: data.email || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          position: data.job_position || '',
          professionalAddress: data.professional_address || '',
          postalCode: data.postal_code || '',
          city: data.city || '',
          country: data.country || 'Vietnam',
          directPhone: data.direct_phone || '',
          mobilePhone: data.mobile_phone || '',
        });

        setCompanyData({
          name: data.company_name || '',
          registrationNumber: data.registration_number || '',
          activities: data.activities || '',
          activitiesOther: data.activities_other || '',
          employeeCount: data.employee_count || '',
          phone: data.company_phone || '',
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        job_position: profileData.position,
        professional_address: profileData.professionalAddress,
        postal_code: profileData.postalCode,
        city: profileData.city,
        country: profileData.country,
        direct_phone: profileData.directPhone,
        mobile_phone: profileData.mobilePhone,
        
        company_name: companyData.name,
        registration_number: companyData.registrationNumber,
        activities: companyData.activities,
        activities_other: companyData.activitiesOther,
        employee_count: companyData.employeeCount,
        company_phone: companyData.phone,
      };

      const res = await updateUser(user.id, payload);

      if (!res.ok) throw new Error(res.data?.detail || 'Có lỗi xảy ra khi cập nhật');

      setSuccess('Cập nhật thông tin thành công!');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await updateUser(user.id, { password: newPassword });

      if (!res.ok) throw new Error(res.data?.detail || 'Failed to update password');

      alert('Đổi mật khẩu thành công!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Có lỗi xảy ra');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Thông tin cá nhân</h1>
        <p className="text-sm text-gray-600 mt-2">Xem và chỉnh sửa thông tin cá nhân và công ty của bạn</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-600 border-b-2 border-red-200 pb-2">
              PHẦN 1: THÔNG TIN CÔNG TY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Tên công ty <span className="text-red-500">*</span></Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => handleCompanyChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Số đăng ký</Label>
              <Input
                id="registrationNumber"
                value={companyData.registrationNumber}
                onChange={(e) => handleCompanyChange('registrationNumber', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="activities">Các hoạt động <span className="text-red-500">*</span></Label>
                <Select
                  value={companyData.activities}
                  onValueChange={(value) => handleCompanyChange('activities', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hoạt động" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITIES_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {companyData.activities === 'Khác' && (
                <div className="space-y-2">
                  <Label htmlFor="activitiesOther">Khác (ghi rõ)</Label>
                  <Input
                    id="activitiesOther"
                    value={companyData.activitiesOther}
                    onChange={(e) => handleCompanyChange('activitiesOther', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="employeeCount">Số lượng nhân viên <span className="text-red-500">*</span></Label>
                <Select
                  value={companyData.employeeCount}
                  onValueChange={(value) => handleCompanyChange('employeeCount', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn số lượng" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_COUNT_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="companyPhone">Số điện thoại chung <span className="text-red-500">*</span></Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-blue-600 border-b-2 border-blue-200 pb-2">
              PHẦN 2: THÔNG TIN NGƯỜI DÙNG
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Key className="w-4 h-4 mr-2" />
                  Thay đổi mật khẩu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thay đổi mật khẩu</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="w-full"
                  >
                    {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Tên đăng nhập (Email) <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-sm text-gray-500">Email không thể thay đổi</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="firstName">Tên <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="lastName">Họ và tên đệm <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                />
            </div>
          </div>

          <div className="space-y-2">
              <Label htmlFor="position">Chức vụ <span className="text-red-500">*</span></Label>
              <Select
                value={profileData.position}
                onValueChange={(value) => handleProfileChange('position', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chức vụ" />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionalAddress">Địa chỉ chuyên nghiệp <span className="text-red-500">*</span></Label>
              <Input
                id="professionalAddress"
                value={profileData.professionalAddress}
                onChange={(e) => handleProfileChange('professionalAddress', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Mã bưu chính <span className="text-red-500">*</span></Label>
                <Input
                  id="postalCode"
                  value={profileData.postalCode}
                  onChange={(e) => handleProfileChange('postalCode', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="city">Thành phố <span className="text-red-500">*</span></Label>
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) => handleProfileChange('city', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="country">Quốc gia <span className="text-red-500">*</span></Label>
                <Select
                  value={profileData.country}
                  onValueChange={(value) => handleProfileChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn quốc gia" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="directPhone">Số điện thoại trực tiếp <span className="text-red-500">*</span></Label>
                <Input
                  id="directPhone"
                  type="tel"
                  value={profileData.directPhone}
                  onChange={(e) => handleProfileChange('directPhone', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="mobilePhone">Số điện thoại di động <span className="text-red-500">*</span></Label>
                <Input
                  id="mobilePhone"
                  type="tel"
                  value={profileData.mobilePhone}
                  onChange={(e) => handleProfileChange('mobilePhone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-cyan-500"
          size="lg"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </div>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
