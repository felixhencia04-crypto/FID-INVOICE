import React, { useState } from 'react';
import { 
  Building2, Save, CreditCard, Bell, Key, Upload, Check, RefreshCw, PenTool, Award, ShieldCheck, User
} from 'lucide-react';
import { UserProfile } from '../types';
import { resizeAndCompressImage } from '../utils';

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export default function ProfileSettings({ user, onUpdateProfile }: ProfileSettingsProps) {
  // Form states
  const [fullName, setFullName] = useState(user.fullName);
  const [businessName, setBusinessName] = useState(user.businessName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState(user.address || '');
  const [taxNumber, setTaxNumber] = useState(user.taxNumber || '');
  
  // Bank details
  const [bankName, setBankName] = useState(user.bankName || 'Bank Mandiri');
  const [bankAccountNumber, setBankAccountNumber] = useState(user.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(user.bankAccountHolder || '');

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [logoBase64, setLogoBase64] = useState(user.businessLogo || '');
  const [profilePictureBase64, setProfilePictureBase64] = useState(user.profilePicture || '');
  const [signatureBase64, setSignatureBase64] = useState(user.signatureImage || '');
  const [stampBase64, setStampBase64] = useState(user.stampImage || '');

  // File Auto-save Logic
  const autoSaveImages = (newLogo: string, newProfile: string, newSig: string, newStamp: string) => {
    const updated: UserProfile = {
      ...user,
      fullName,
      businessName,
      email,
      phone,
      address,
      taxNumber,
      bankName,
      bankAccountNumber,
      bankAccountHolder,
      businessLogo: newLogo,
      profilePicture: newProfile,
      signatureImage: newSig,
      stampImage: newStamp
    };
    onUpdateProfile(updated);
  };

  // File Upload Logic with Auto-compression and Instant Auto-Save!
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await resizeAndCompressImage(reader.result as string, 300, 300, 0.75);
        setProfilePictureBase64(compressed);
        autoSaveImages(logoBase64, compressed, signatureBase64, stampBase64);
        setSuccessMsg('Foto profil berhasil diunggah & disimpan!');
        setTimeout(() => setSuccessMsg(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await resizeAndCompressImage(reader.result as string, 400, 400, 0.8);
        setLogoBase64(compressed);
        autoSaveImages(compressed, profilePictureBase64, signatureBase64, stampBase64);
        setSuccessMsg('Logo bisnis berhasil diunggah & disimpan!');
        setTimeout(() => setSuccessMsg(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await resizeAndCompressImage(reader.result as string, 400, 200, 0.7);
        setSignatureBase64(compressed);
        autoSaveImages(logoBase64, profilePictureBase64, compressed, stampBase64);
        setSuccessMsg('Tanda tangan elektronik berhasil diunggah & disimpan!');
        setTimeout(() => setSuccessMsg(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await resizeAndCompressImage(reader.result as string, 300, 300, 0.7);
        setStampBase64(compressed);
        autoSaveImages(logoBase64, profilePictureBase64, signatureBase64, compressed);
        setSuccessMsg('Cap/Stempel elektronik berhasil diunggah & disimpan!');
        setTimeout(() => setSuccessMsg(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePictureBase64('');
    autoSaveImages(logoBase64, '', signatureBase64, stampBase64);
    setSuccessMsg('Foto profil berhasil dihapus!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveLogo = () => {
    setLogoBase64('');
    autoSaveImages('', profilePictureBase64, signatureBase64, stampBase64);
    setSuccessMsg('Logo bisnis berhasil dihapus!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveSignature = () => {
    setSignatureBase64('');
    autoSaveImages(logoBase64, profilePictureBase64, '', stampBase64);
    setSuccessMsg('Tanda tangan berhasil dihapus!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveStamp = () => {
    setStampBase64('');
    autoSaveImages(logoBase64, profilePictureBase64, signatureBase64, '');
    setSuccessMsg('Cap/Stempel berhasil dihapus!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const updated: UserProfile = {
        ...user,
        fullName,
        businessName,
        email,
        phone,
        address,
        taxNumber,
        bankName,
        bankAccountNumber,
        bankAccountHolder,
        businessLogo: logoBase64,
        profilePicture: profilePictureBase64,
        signatureImage: signatureBase64,
        stampImage: stampBase64
      };
      
      onUpdateProfile(updated);
      setIsLoading(false);
      setSuccessMsg('Profil bisnis Anda berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans text-left pb-16">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-display font-extrabold text-brand-dark">Pengaturan Profil & Bisnis</h1>
        <p className="text-xs text-gray-400 mt-1">Lengkapi data bisnis resmi Anda yang akan tercantum pada invoice resmi</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-600 font-bold flex items-center gap-1.5">
          <Check className="w-4.5 h-4.5 text-green-500" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Logo & Bank details */}
        <div className="md:col-span-4 space-y-6">
          {/* Foto Profil Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Foto Profil Pengguna</h4>
            
            <div className="w-24 h-24 rounded-full bg-brand-primary-light border border-brand-primary/10 flex items-center justify-center overflow-hidden shadow-inner relative group">
              {profilePictureBase64 ? (
                <img src={profilePictureBase64} alt="User profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-brand-primary font-black text-2xl font-display">
                  {fullName ? fullName.substring(0, 2).toUpperCase() : 'ME'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full items-center">
              <label className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Unggah Foto
                <input type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
              </label>
              
              {profilePictureBase64 && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePicture}
                  className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
                >
                  Hapus Foto Profil
                </button>
              )}
            </div>
            <p className="text-[9px] text-gray-400">Rasio 1:1 direkomendasikan, format JPG/PNG</p>
          </div>

          {/* Logo Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Logo Perusahaan</h4>
            
            <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner relative group">
              {logoBase64 ? (
                <img src={logoBase64} alt="Business logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-10 h-10 text-gray-300" />
              )}
            </div>

            <div className="flex flex-col gap-2 w-full items-center">
              <label className="px-4 py-2 bg-brand-primary-light hover:bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-xl cursor-pointer border border-dashed border-brand-primary/20 transition-colors flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Unggah Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              
              {logoBase64 && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
                >
                  Hapus Logo
                </button>
              )}
            </div>
            <p className="text-[9px] text-gray-400">Dimensi ideal 500x500px, format JPG/PNG</p>
          </div>

          {/* Digital Verification & Stamp Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-left">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-50 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              Verifikasi & Legalisasi
            </h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Tanda tangan & stempel elektronik ini akan terintegrasi otomatis di semua kuitansi, laporan, dan invoice resmi Anda.
            </p>

            {/* Electronic Signature */}
            <div className="space-y-2 pt-2 border-t border-gray-50 flex flex-col items-center">
              <div className="flex justify-between w-full items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5 text-gray-400" />
                  Tanda Tangan
                </span>
                {signatureBase64 && (
                  <button 
                    type="button" 
                    onClick={handleRemoveSignature}
                    className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="w-full h-20 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-center overflow-hidden shadow-inner relative group p-2">
                {signatureBase64 ? (
                  <img src={signatureBase64} alt="E-Signature" className="h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-gray-400 italic font-serif">
                      {fullName || 'Owner Name'}
                    </p>
                    <p className="text-[8px] text-gray-400 mt-0.5">(Belum diunggah)</p>
                  </div>
                )}
              </div>
              <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 self-center">
                <Upload className="w-3 h-3" />
                Unggah TTD
                <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
              </label>
            </div>

            {/* Electronic Stamp/Seal */}
            <div className="space-y-2 pt-3 border-t border-gray-50 flex flex-col items-center">
              <div className="flex justify-between w-full items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-gray-400" />
                  Cap / Stempel
                </span>
                {stampBase64 && (
                  <button 
                    type="button" 
                    onClick={handleRemoveStamp}
                    className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="w-full h-20 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-center overflow-hidden shadow-inner relative group p-1">
                {stampBase64 ? (
                  <img src={stampBase64} alt="E-Stamp" className="h-full object-contain" />
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Generated SVG stamp placeholder */}
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-blue-400 flex items-center justify-center p-0.5">
                      <div className="w-full h-full rounded-full border border-blue-400 flex flex-col items-center justify-center text-[5px] text-blue-500 font-extrabold leading-none scale-90">
                        <span className="uppercase text-[3.5px] font-mono tracking-tighter">{businessName ? businessName.substring(0, 8) : 'COMPANY'}</span>
                        <span className="border-t border-blue-300 pt-0.5 mt-0.5 uppercase scale-75 text-[3px] text-blue-400">OFFICIAL</span>
                      </div>
                    </div>
                    <div className="text-left leading-tight">
                      <p className="text-[9px] font-bold text-gray-500 uppercase max-w-[120px] truncate">{businessName || 'NAMA PERUSAHAAN'}</p>
                      <p className="text-[8px] text-gray-400">(Default Aktif)</p>
                    </div>
                  </div>
                )}
              </div>
              <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 self-center">
                <Upload className="w-3 h-3" />
                Unggah Cap
                <input type="file" accept="image/*" onChange={handleStampUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Bank Payment Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-50 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-brand-primary" />
              Instruksi Transfer
            </h4>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Bank</label>
                <select 
                  value={bankName} 
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-brand-primary"
                >
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank BCA">Bank BCA</option>
                  <option value="Bank BNI">Bank BNI</option>
                  <option value="Bank BRI">Bank BRI</option>
                  <option value="Bank Syariah Indonesia">Bank Syariah Indonesia (BSI)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nomor Rekening</label>
                <input 
                  type="text" 
                  value={bankAccountNumber} 
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="e.g. 124-00-987654-3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-brand-primary font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Pemilik Rekening</label>
                <input 
                  type="text" 
                  value={bankAccountHolder} 
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="e.g. PT Creative Digital"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Business Details form */}
        <div className="md:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-50">Profil Hukum Bisnis Resmi</h3>

          <div className="grid sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nama Lengkap Owner</label>
              <input 
                required 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nama Legal Bisnis / Perusahaan</label>
              <input 
                required 
                type="text" 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Email Penagihan Resmi</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">No. Telepon / WhatsApp Bisnis</label>
              <input 
                required 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">NPWP Perusahaan (Opsional)</label>
            <input 
              type="text" 
              value={taxNumber} 
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="e.g. 01.234.567.8-012.000"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all font-mono"
            />
          </div>

          <div className="text-xs">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Alamat Kantor Resmi</label>
            <textarea 
              rows={3} 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all resize-none"
              placeholder="Alamat lengkap beserta kode pos..."
            />
          </div>

          <div className="pt-4 border-t border-gray-50 flex justify-end">
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Profil Bisnis
            </button>
          </div>

        </div>

      </form>

    </div>
  );
}
