export default function BatteryIndicator({ percentage, charging, showPercentage = false }) {
  return (
    <span className="ubuntu-battery" title={`Batterie : ${percentage} %${charging ? ' · En charge' : ''}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="6" y="0" width="4" height="2" rx="0.5" />
        <rect x="3.5" y="1.5" width="9" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {charging ? <path d="M8.6 3 5.3 8.5H8l-.6 4.5 3.3-6H8.1Z" /> :
          <rect x="5" y={13 - percentage / 10} width="6" height={percentage / 10} rx="0.7" />}
      </svg>
      {showPercentage && <span>{percentage} %</span>}
    </span>
  );
}
