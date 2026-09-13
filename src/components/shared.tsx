import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { statusLabels } from '../lib/types';
export function Panel({title,action,children,className=''}:{title?:string;action?:ReactNode;children:ReactNode;className?:string}) {return <section className={`panel ${className}`}>{title&&<div className="panel-heading"><h2>{title}</h2>{action}</div>}{children}</section>}
export function Empty({title,detail}:{title:string;detail?:string}) {return <div className="empty"><Inbox size={28}/><strong>{title}</strong>{detail&&<p>{detail}</p>}</div>}
export function Status({value}:{value:string}) {return <span className={`status ${value}`}>{statusLabels[value]||value}</span>}
export function download(name:string,content:string) {const url=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function formatDate(value:string){return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}
