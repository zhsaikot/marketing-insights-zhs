import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const reports = ['Monthly performance report', 'SEO content opportunities', 'Executive channel summary'];
export function Reports() { return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">Shareable outputs</p><h2>Reports</h2><p className="muted">Create and manage the reports your team relies on.</p></div><Button>Create report</Button></div><Card><div className="simple-list">{reports.map((report, index) => <div className="simple-row" key={report}><div className="report-icon">PDF</div><div><strong>{report}</strong><span>Updated {index + 1} day{index ? 's' : ''} ago</span></div><Button variant="ghost">Open</Button></div>)}</div></Card></div>; }
