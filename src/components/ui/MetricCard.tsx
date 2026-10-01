import type { Metric } from '../../types';
import {
  Activity,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface MetricCardProps {
  metric: Metric;
  index?: number;
}

export function MetricCard({ metric, index = 0 }: MetricCardProps) {
  // Determine icon & color badge theme based on label or index
  const labelLower = metric.label.toLowerCase();

  let theme: 'green' | 'purple' | 'blue' | 'pink' = 'green';
  let IconComponent = Activity;

  if (labelLower.includes('session') || labelLower.includes('traffic')) {
    theme = 'green';
    IconComponent = Activity;
  } else if (labelLower.includes('conversion') || labelLower.includes('goal')) {
    theme = 'purple';
    IconComponent = Target;
  } else if (labelLower.includes('user') || labelLower.includes('reach') || labelLower.includes('audience')) {
    theme = 'blue';
    IconComponent = Users;
  } else if (labelLower.includes('spend') || labelLower.includes('roas') || labelLower.includes('cost')) {
    theme = 'pink';
    IconComponent = DollarSign;
  } else {
    const fallbackThemes: ('green' | 'purple' | 'blue' | 'pink')[] = ['green', 'purple', 'blue', 'pink'];
    theme = fallbackThemes[index % 4];
  }

  const isUp = metric.trend === 'up';
  const isDown = metric.trend === 'down';

  return (
    <div className="sociafy-metric-card">
      <div className="sociafy-metric-top">
        <h4 className="sociafy-metric-label">{metric.label}</h4>
        <div className={`sociafy-metric-badge ${theme}`}>
          <IconComponent size={18} />
        </div>
      </div>

      <div className="sociafy-metric-bottom">
        <div className="sociafy-metric-row">
          <span className="sociafy-metric-value">{metric.value}</span>
          <span className={`sociafy-pill-trend ${isUp ? 'up' : isDown ? 'down' : 'neutral'}`}>
            {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : null}
            {metric.change}
          </span>
        </div>
        <span className="sociafy-metric-sub">from last month</span>
      </div>
    </div>
  );
}
