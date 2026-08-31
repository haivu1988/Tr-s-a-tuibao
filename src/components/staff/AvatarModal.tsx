import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { 
  Camera, 
  Upload, 
  Check, 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  RefreshCw, 
  Link as LinkIcon 
} from 'lucide-react';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveAvatar: (newAvatarUrl: string) => void;
}

const PRESET_AVATARS = [
  {
    id: 'av_1',
    category: 'Chân Dung Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_2',
    category: 'Chân Dung Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_3',
    category: 'Chân Dung Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_4',
    category: 'Chân Dung Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_5',
    category: 'Chân Dung Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_6',
    category: 'Chân Dung Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_7',
    category: 'Chân Dung Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_8',
    category: 'Chân Dung Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_9',
    category: 'Phong Cách Trẻ Trung',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_10',
    category: 'Phong Cách Trẻ Trung',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_11',
    category: 'Phong Cách Trẻ Trung',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_12',
    category: 'Phong Cách Trẻ Trung',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
  },
];

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveAvatar,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentUser?.avatar || '');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (currentUser?.avatar) {
      setPreviewUrl(currentUser.avatar);
    }
  }, [currentUser?.avatar]);

  if (!isOpen || !currentUser) return null;

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Kích thước ảnh tối đa là 3MB');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPreviewUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrlInput.trim().startsWith('http')) {
      setPreviewUrl(customUrlInput.trim());
      setShowUrlInput(false);
      setCustomUrlInput('');
      setUploadError('');
    } else {
      setUploadError('Vui lòng nhập đường link ảnh hợp lệ bắt đầu bằng https://');
    }
  };

  const handleSave = () => {
    if (!previewUrl) return;
    onSaveAvatar(previewUrl);
    setSuccessMsg('Đã cập nhật ảnh đại diện thành công!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Đổi Ảnh Đại Diện (Avatar)
              </h3>
              <p className="text-xs text-slate-500">
                Tải ảnh từ máy hoặc chọn bộ sưu tập đại diện phong cách
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
              {uploadError}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Active Preview & Upload Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span>Đổi Ảnh</span>
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {currentUser.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Mã NV: {currentUser.id}
                </p>
              </div>

              {/* Action Buttons: Upload File & URL */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh từ máy / điện thoại</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nhập Link ảnh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Custom Link URL Input */}
          {showUrlInput && (
            <form onSubmit={handleApplyCustomUrl} className="space-y-2 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-700">
                Dán đường dẫn link ảnh (URL):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  Áp Dụng
                </button>
              </div>
            </form>
          )}

          {/* Preset Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Hoặc chọn nhanh từ bộ sưu tập avatar:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                ({PRESET_AVATARS.length} mẫu)
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-1">
              {PRESET_AVATARS.map((av) => {
                const isSelected = previewUrl === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setPreviewUrl(av.url);
                      setUploadError('');
                    }}
                    className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer p-0.5 ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500 scale-105 shadow-md'
                        : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt="Preset avatar"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                        <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lưu Ảnh Đại Diện Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
