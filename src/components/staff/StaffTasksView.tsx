import React, { useState } from 'react';
import { User, TaskItem, ShiftType } from '../../types';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Search,
  Sparkles,
  ChevronDown,
  UserCheck
} from 'lucide-react';

interface StaffTasksViewProps {
  currentUser: User;
  tasks: TaskItem[];
  onToggleTaskChecklist: (taskId: string, checklistId: string) => void;
  onUpdateTaskNote?: (taskId: string, note: string) => void;
}

export const StaffTasksView: React.FC<StaffTasksViewProps> = ({
  currentUser,
  tasks,
  onToggleTaskChecklist,
}) => {
  const [filterDate, setFilterDate] = useState<'today' | 'all'>('today');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks relevant to current user or general
  const relevantTasks = tasks.filter((t) => {
    // Assigned to current user or general team task
    const isForMe = !t.assignedToUserId || t.assignedToUserId === currentUser.id;
    if (!isForMe) return false;

    if (filterDate === 'today' && t.date !== todayStr) return false;

    if (filterStatus === 'pending' && t.progress === 100) return false;
    if (filterStatus === 'completed' && t.progress < 100) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const totalTasks = tasks.filter(
    (t) => !t.assignedToUserId || t.assignedToUserId === currentUser.id
  );
  const completedCount = totalTasks.filter((t) => t.progress === 100).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Nhiệm Vụ & Tiến Độ Công Việc Hàng Ngày
            </h2>
            <p className="text-xs text-slate-500">
              Đã hoàn thành <span className="font-bold text-emerald-700">{completedCount}/{totalTasks.length} nhiệm vụ</span> được giao
            </p>
          </div>
        </div>

        {/* Search & Quick Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm nhiệm vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-48 sm:w-60"
            />
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-700 border border-slate-200">
            <button
              onClick={() => setFilterDate('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterDate === 'today'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setFilterDate('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterDate === 'all'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantTasks.map((task) => {
          const isDone = task.progress === 100;

          return (
            <div
              key={task.id}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                isDone
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                {/* Priority & Date Tags */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {task.priority === 'high' ? 'Ưu tiên cao' : task.priority === 'medium' ? 'Ưu tiên vừa' : 'Bình thường'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {task.date}
                    </span>
                  </div>

                  <span className="text-xs font-black font-mono text-emerald-700">
                    {task.progress}%
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Checklist items */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Quy trình checklist thực hiện:
                  </div>
                  {task.checklists.map((chk) => (
                    <label
                      key={chk.id}
                      className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer hover:text-slate-900 select-none py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={chk.done}
                        onChange={() => onToggleTaskChecklist(task.id, chk.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                      <span className={chk.done ? 'line-through text-slate-400 font-normal' : 'font-medium'}>
                        {chk.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Progress Bar & Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Giao bởi: <span className="font-semibold text-slate-700">{task.createdBy}</span>
                </div>
                {isDone ? (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Đã hoàn tất
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    Đang tiến hành
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {relevantTasks.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tất cả nhiệm vụ đã hoàn thành hoặc không có việc mới</h3>
            <p className="text-xs text-slate-400">Hãy tiếp tục duy trì chất lượng phục vụ trong ca làm!</p>
          </div>
        )}
      </div>
    </div>
  );
};
