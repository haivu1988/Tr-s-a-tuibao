import React, { useState } from 'react';
import { Branch, User } from '../../types';
import { 
  X, 
  Wifi, 
  Smartphone, 
  RotateCcw, 
  Check, 
  Pin, 
  Building2, 
  Plus, 
  Globe,
  Radio,
  Trash2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { fetchCurrentPublicIp, isValidIpAddress, getSimulatedIp } from '../../utils/deviceWifi';

interface WifiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onPinWifi: (branchId: string, wifiSsid: string) => void;
  onSaveBranch: (branch: Branch) => void;
  staffList: User[];
  onResetDevice: (userId: string) => void;
}

export const WifiSettingsModal: React.FC<WifiSettingsModalProps> = ({
  isOpen,
  onClose,
  branches = [],
  activeBranchId,
  onSelectBranch,
  onPinWifi,
  onSaveBranch,
  staffList = [],
  onResetDevice,
}) => {
  if (!isOpen) return null;

  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId);
  const [customIpInput, setCustomIpInput] = useState<string>('');
  const [newCustomWifi, setNewCustomWifi] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDetectingIp, setIsDetectingIp] = useState<boolean>(false);

  const currentBranch = branches?.find((b) => b.id === selectedBranchId) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    pinnedWifiIp: '118.69.182.45',
    allowedWifiIps: ['118.69.182.45'],
    pinnedWifiSsid: 'Store_Main_5G',
    availableWifis: ['Store_Main_5G'],
    status: 'active',
  };

  const showSuccess = (msg: string) => {
    setMessage(msg);
    setError('');
    setTimeout(() => setMessage(''), 3500);
  };

  const showError = (err: string) => {
    setError(err);
    setTimeout(() => setError(''), 4000);
  };

  // Auto detect current public network IP and pin it to the active branch
  const handleAutoDetectAndPinIp = async () => {
    setIsDetectingIp(true);
    try {
      const detectedIp = await fetchCurrentPublicIp();
      if (!detectedIp) {
        showError('Không thể tự động phát hiện IP mạng hiện tại. Vui lòng nhập thủ công.');
        return;
      }

      const existingAllowed = currentBranch.allowedWifiIps || [];
      const updatedAllowed = existingAllowed.includes(detectedIp)
        ? existingAllowed
        : [...existingAllowed, detectedIp];

      const updatedBranch: Branch = {
        ...currentBranch,
        pinnedWifiIp: detectedIp,
        allowedWifiIps: updatedAllowed,
      };

      onSaveBranch(updatedBranch);
      showSuccess(`Đã tự động nhận diện & ghim IP "${detectedIp}" cho ${currentBranch.name}!`);
    } catch {
      showError('Lỗi khi lấy IP mạng.');
    } finally {
      setIsDetectingIp(false);
    }
  };

  // Manually Pin an IP address
  const handlePinCustomIp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = customIpInput.trim();
    if (!cleanIp) {
      showError('Vui lòng nhập địa chỉ IP WiFi (vd: 118.69.182.45)');
      return;
    }

    if (!isValidIpAddress(cleanIp)) {
      showError('Định dạng IP không hợp lệ. Vui lòng nhập đúng IPv4 (vd: 118.69.182.45) hoặc IPv6.');
      return;
    }

    const existingAllowed = currentBranch.allowedWifiIps || [];
    const updatedAllowed = existingAllowed.includes(cleanIp)
      ? existingAllowed
      : [...existingAllowed, cleanIp];

    const updatedBranch: Branch = {
      ...currentBranch,
      pinnedWifiIp: cleanIp,
      allowedWifiIps: updatedAllowed,
    };

    onSaveBranch(updatedBranch);
    setCustomIpInput('');
    showSuccess(`Đã ghim thành công IP WiFi "${cleanIp}" cho ${currentBranch.name}!`);
  };

  // Add backup IP to allowed list
  const handleSetAsPrimaryIp = (ip: string) => {
    const updatedBranch: Branch = {
      ...currentBranch,
      pinnedWifiIp: ip,
    };
    onSaveBranch(updatedBranch);
    showSuccess(`Đã chọn IP "${ip}" làm IP chấm công chính thức cho ${currentBranch.name}!`);
  };

  // Remove IP from allowed list
  const handleRemoveIp = (ipToRemove: string) => {
    if (currentBranch.pinnedWifiIp === ipToRemove && (currentBranch.allowedWifiIps || []).length <= 1) {
      showError('Chi nhánh phải có ít nhất 1 IP WiFi được ghim để chấm công!');
      return;
    }

    const updatedAllowed = (currentBranch.allowedWifiIps || []).filter((ip) => ip !== ipToRemove);
    const newPinnedIp = currentBranch.pinnedWifiIp === ipToRemove ? updatedAllowed[0] || '' : currentBranch.pinnedWifiIp;

    const updatedBranch: Branch = {
      ...currentBranch,
      pinnedWifiIp: newPinnedIp,
      allowedWifiIps: updatedAllowed,
    };

    onSaveBranch(updatedBranch);
    showSuccess(`Đã xóa IP "${ipToRemove}" khỏi danh sách của ${currentBranch.name}!`);
  };

  // WiFi SSID Pinning
  const handlePinThisWifi = (ssid: string) => {
    onPinWifi(currentBranch.id, ssid);
    showSuccess(`Đã ghim "${ssid}" làm tên WiFi chấm công cho ${currentBranch.name}!`);
  };

  const handleAddNewAndPinWifi = (e: React.FormEvent) => {
    e.preventDefault();
    const ssid = newCustomWifi.trim();
    if (!ssid) return;

    const updatedAvailable = currentBranch.availableWifis.includes(ssid)
      ? currentBranch.availableWifis
      : [...currentBranch.availableWifis, ssid];

    const updatedBranch: Branch = {
      ...currentBranch,
      pinnedWifiSsid: ssid,
      availableWifis: updatedAvailable,
    };

    onSaveBranch(updatedBranch);
    setNewCustomWifi('');
    showSuccess(`Đã thêm & ghim "${ssid}" làm WiFi chấm công cho ${currentBranch.name}!`);
  };

  const branchStaff = staffList.filter(
    (s) => s.role === 'staff' && s.branchId === currentBranch.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center font-black">
              <Pin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                Ghim Địa Chỉ IP & WiFi Chấm Công Từng Chi Nhánh
              </h3>
              <p className="text-xs text-slate-400">
                Thiết lập IP mạng quán và tên WiFi được phép chấm công độc lập cho từng chi nhánh.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Feedback Messages */}
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Branch Switcher Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Chọn Chi Nhánh Muốn Cấu Hình & Ghim IP WiFi:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {branches.map((b) => {
                const isSelected = b.id === currentBranch.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs truncate flex items-center justify-between">
                      <span>{b.shortName}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{b.name}</div>
                    <div className="mt-1.5 space-y-0.5">
                      <div className="text-[10px] font-mono text-emerald-700 font-bold truncate flex items-center space-x-1">
                        <Globe className="w-2.5 h-2.5 shrink-0" />
                        <span>IP: {b.pinnedWifiIp || 'Chưa ghim IP'}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-600 truncate flex items-center space-x-1">
                        <Wifi className="w-2.5 h-2.5 shrink-0" />
                        <span>WiFi: {b.pinnedWifiSsid}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN FEATURE: IP PINNING FOR SELECTED BRANCH */}
          <div className="bg-emerald-950/5 border-2 border-emerald-600/30 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-900/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>Ghim Địa Chỉ IP WiFi Quán ({currentBranch.shortName})</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                      Trọng Tâm
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Nhân viên {currentBranch.shortName} bắt buộc phải có địa chỉ IP trùng khớp với IP quán mới chấm công được.
                  </p>
                </div>
              </div>

              {/* Quick Auto-Detect & Pin button */}
              <button
                type="button"
                onClick={handleAutoDetectAndPinIp}
                disabled={isDetectingIp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${isDetectingIp ? 'animate-spin' : ''}`} />
                <span>{isDetectingIp ? 'Đang dò IP...' : 'Lấy IP Mạng Hiện Tại Để Ghim'}</span>
              </button>
            </div>

            {/* Currently Pinned IP Hero Badge */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Pin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    IP WiFi Đang Ghim Cho {currentBranch.name}:
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono text-emerald-700">
                    {currentBranch.pinnedWifiIp || 'Chưa cấu hình'}
                  </div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4">
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                  ✓ Bắt Buộc Khớp Khi Check-in
                </span>
              </div>
            </div>

            {/* List of Allowed/Backup IPs for this branch */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Danh Sách Địa Chỉ IP Hợp Lệ Của Chi Nhánh (Hỗ trợ quán có nhiều đường truyền mạng FPT/Viettel/VNPT):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(currentBranch.allowedWifiIps || [currentBranch.pinnedWifiIp]).map((ip) => {
                  const isPrimary = currentBranch.pinnedWifiIp === ip;
                  return (
                    <div
                      key={ip}
                      className={`p-2.5 rounded-xl border flex items-center justify-between bg-white transition-all ${
                        isPrimary
                          ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Globe className={`w-3.5 h-3.5 shrink-0 ${isPrimary ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="font-mono text-xs font-bold text-slate-800 truncate">{ip}</span>
                        {isPrimary && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            Chính
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetAsPrimaryIp(ip)}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Đặt Làm Chính
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveIp(ip)}
                          title="Xóa IP này"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Manual Form: Add & Pin new IP */}
            <form onSubmit={handlePinCustomIp} className="pt-1">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nhập Địa Chỉ IP Quán Mới Để Ghim (IPv4 / IPv6):
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={customIpInput}
                    onChange={(e) => setCustomIpInput(e.target.value)}
                    placeholder="vd: 118.69.182.45 hoặc 14.169.85.120..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center space-x-1"
                >
                  <Pin className="w-3 h-3" />
                  <span>Ghim IP Này</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                *Khi nhân viên bấm chấm công, hệ thống sẽ kiểm tra IP mạng của nhân viên có khớp với IP này không.
              </p>
            </form>
          </div>

          {/* SECONDARY: TÊN WIFI (SSID) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tên WiFi (SSID) Đi Kèm Cho: {currentBranch.shortName}</span>
                </span>
                <p className="text-[10px] text-slate-400">
                  Tên WiFi đang ghim: <span className="font-mono font-bold text-slate-700">{currentBranch.pinnedWifiSsid}</span>
                </p>
              </div>
            </div>

            {/* List of candidate WiFis with PIN button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentBranch.availableWifis.map((wifiSsid) => {
                const isPinned = currentBranch.pinnedWifiSsid === wifiSsid;
                return (
                  <div
                    key={wifiSsid}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isPinned
                        ? 'bg-white border-emerald-500 shadow-2xs ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <Wifi className={`w-3.5 h-3.5 shrink-0 ${isPinned ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="font-mono text-xs font-bold truncate">{wifiSsid}</span>
                    </div>

                    {isPinned ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white flex items-center space-x-1 shrink-0">
                        <Pin className="w-2.5 h-2.5" />
                        <span>ĐÃ GHIM</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePinThisWifi(wifiSsid)}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 flex items-center space-x-1"
                      >
                        <Pin className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Ghim</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add & Pin new WiFi SSID */}
            <form onSubmit={handleAddNewAndPinWifi} className="pt-1">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Wifi className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={newCustomWifi}
                    onChange={(e) => setNewCustomWifi(e.target.value)}
                    placeholder="Nhập tên WiFi mới để ghim (vd: Store_Wifi_5G)..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm & Ghim</span>
                </button>
              </div>
            </form>
          </div>

          {/* DEVICE ID MANAGEMENT FOR BRANCH STAFF */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Khóa Mã Máy Nhân Viên ({currentBranch.shortName})
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">
                *Chống chấm công hộ
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 text-left">
                    <th className="p-2.5">Nhân viên</th>
                    <th className="p-2.5">Mã máy đã khóa</th>
                    <th className="p-2.5 text-right">Reset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 bg-white">
                  {branchStaff.length > 0 ? (
                    branchStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-800 flex items-center space-x-2">
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                          <span className="truncate">{staff.name}</span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {staff.registeredDeviceId ? (
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                              {staff.registeredDeviceId}
                            </span>
                          ) : (
                            <span className="text-amber-600 text-[10px] italic font-medium">
                              Chờ ĐK lần đầu
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          {staff.registeredDeviceId ? (
                            <button
                              onClick={() => {
                                onResetDevice(staff.id);
                                showSuccess(`Đã reset mã máy của ${staff.name}!`);
                              }}
                              className="px-2 py-1 text-[10px] font-semibold text-blue-600 hover:bg-blue-50 rounded border border-blue-200 cursor-pointer inline-flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-xs text-slate-400">
                        Chưa có nhân viên nào thuộc chi nhánh này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  );
};

