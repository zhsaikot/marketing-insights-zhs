import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function Topbar({ title }: { title: string }) {
  return <header className="topbar"><div><p className="breadcrumb">Workspace / {title}</p><h1>{title}</h1></div><div className="topbar-actions"><Input placeholder="Search insights" aria-label="Search insights" /><Button variant="secondary">Export report</Button><div className="avatar" title="Account">ZH</div></div></header>;
}
