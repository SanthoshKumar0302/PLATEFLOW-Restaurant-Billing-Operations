import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  const bgColor = {
    success: 'bg-green-500/20 border-green-500/40',
    error: 'bg-red-500/20 border-red-500/40',
    info: 'bg-blue-500/20 border-blue-500/40',
  }[type];

  const textColor = {
    success: 'text-green-300',
    error: 'text-red-300',
    info: 'text-blue-300',
  }[type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <div className={`${bgColor} border rounded-lg px-4 py-3 flex items-center gap-3 animate-slideIn`}>
      <Icon size={18} className={textColor} />
      <span className="text-sm font-medium text-graphite-100">{message}</span>
    </div>
  );
}
