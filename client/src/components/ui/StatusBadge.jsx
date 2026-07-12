import { STATUS_STYLES } from '../../utils/constants';

export default function StatusBadge({ status, size = 'sm' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border
      ${size === 'sm' ? 'text-xs' : 'text-sm px-3 py-1'}
      ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
