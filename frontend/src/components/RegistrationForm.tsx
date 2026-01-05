import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { register } from '../api/api';

interface RegistrationData {
  email: string;
  password: string;
  companyName: string;
  registrationNumber: string;
  activities: string;
  activitiesOther: string;
  employeeCount: string;
  companyPhone: string;
  firstName: string;
  lastName: string;
  position: string;
  professionalAddress: string;
  postalCode: string;
  city: string;
  country: string;
  directPhone: string;
  mobilePhone: string;
}

interface RegistrationFormProps {
  onSuccess: (data?: any) => void;
  onCancel: () => void;
}

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

export default function RegistrationForm({ onSuccess, onCancel }: RegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    companyName: '',
    registrationNumber: '',
    activities: '',
    activitiesOther: '',
    employeeCount: '',
    companyPhone: '',
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

  const handleChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Map form data to backend schema (snake_case) for api.register
    const payload = {
      email: formData.email,
      password: formData.password,
      company_name: formData.companyName,
      registration_number: formData.registrationNumber,
      activities: formData.activities,
      activities_other: formData.activitiesOther,
      employee_count: formData.employeeCount,
      company_phone: formData.companyPhone,
      first_name: formData.firstName,
      last_name: formData.lastName,
      job_position: formData.position,
      professional_address: formData.professionalAddress,
      postal_code: formData.postalCode,
      city: formData.city,
      country: formData.country,
      direct_phone: formData.directPhone,
      mobile_phone: formData.mobilePhone,
    };

    let res;
    try {
      res = await register(payload);
    } catch (err) {
      console.error("Registration API error:", err);
      setError('An error occurred. Please try again.');
      setLoading(false);
      return;
    }

    if (res.ok) {
      setLoading(false);
      setShowSuccess(true);
      // Tự động chuyển trang sau 2 giây
      setTimeout(() => {
        onSuccess(res.data);
      }, 2000);
    } else {
      setError(res.data?.detail || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Đăng ký thành công!</h3>
              <p className="text-gray-500">
                Tài khoản của bạn đã được tạo thành công.
                <br />
                Đang chuyển hướng đến trang đăng nhập...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-green-500 h-1.5 rounded-full w-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-red-600 border-b-2 border-red-200 pb-2">
            PHẦN 1: THÔNG TIN CÔNG TY CỦA BẠN
          </h3>

          <div className="space-y-4 pl-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Tên công ty
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                required
                placeholder="Nhập tên công ty"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Số đăng ký</Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                placeholder="Nhập số đăng ký"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activities" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Các hoạt động
              </Label>
              <Select
                value={formData.activities}
                onValueChange={(value) => handleChange('activities', value)}
                required
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

            {formData.activities === 'Khác' && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="activitiesOther">Khác (ghi rõ)</Label>
                <Input
                  id="activitiesOther"
                  value={formData.activitiesOther}
                  onChange={(e) => handleChange('activitiesOther', e.target.value)}
                  placeholder="Nhập hoạt động khác"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="employeeCount" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Số lượng người trong công ty
              </Label>
              <Select
                value={formData.employeeCount}
                onValueChange={(value) => handleChange('employeeCount', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn số lượng nhân viên" />
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
              <Label htmlFor="companyPhone" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Số điện thoại chung
              </Label>
              <Input
                id="companyPhone"
                type="tel"
                value={formData.companyPhone}
                onChange={(e) => handleChange('companyPhone', e.target.value)}
                required
                placeholder="Nhập số điện thoại công ty"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-blue-600 border-b-2 border-blue-200 pb-2">
            PHẦN 2: THÔNG TIN NGƯỜI DÙNG
          </h3>

          <div className="space-y-4 pl-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Tên đăng nhập để kết nối (Email)
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Mật khẩu
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={6}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  Tên
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  placeholder="Tên"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  Họ và tên đệm
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  placeholder="Họ và tên đệm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Chức năng
              </Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleChange('position', value)}
                required
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
              <Label htmlFor="professionalAddress" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Địa chỉ chuyên nghiệp
              </Label>
              <Input
                id="professionalAddress"
                value={formData.professionalAddress}
                onChange={(e) => handleChange('professionalAddress', e.target.value)}
                required
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  Mã bưu chính
                </Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  required
                  placeholder="Mã bưu chính"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  Thành phố
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  required
                  placeholder="Thành phố"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-1">
                <span className="text-red-500">*</span>
                Quốc gia
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleChange('country', value)}
                required
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="directPhone" className="flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  Số điện thoại trực tiếp
                </Label>
                <Input
                  id="directPhone"
                  type="tel"
                  value={formData.directPhone}
                  onChange={(e) => handleChange('directPhone', e.target.value)}
                  required
                  placeholder="Số điện thoại"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobilePhone" className="flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  Số điện thoại di động
                </Label>
                <Input
                  id="mobilePhone"
                  type="tel"
                  value={formData.mobilePhone}
                  onChange={(e) => handleChange('mobilePhone', e.target.value)}
                  required
                  placeholder="Số điện thoại di động"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500"
            disabled={loading || showSuccess}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </div>
            ) : (
              'Đăng ký'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading || showSuccess}
          >
            Hủy
          </Button>
        </div>
      </form>
    </>
  );
}
