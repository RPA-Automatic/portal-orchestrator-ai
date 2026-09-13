/** Papéis visuais comuns aos produtos RPA Automatic. Assets locais, sem dependência de outro portal. */
export function BrandTop() {
  return <img className="brand-primary" src="/brand/rpa-automatic-primary.png" alt="RPA Automatic" width={1254} height={1254}/>;
}

export function AssistantIcon({ label = 'Assistência e monitoramento' }: { label?: string }) {
  return <img className="assistant-avatar" src="/brand/rpa-automatic-icon.png" alt={label} width={1254} height={1254}/>;
}

export function BrandFooter() {
  return <footer className="brand-footer">
    <img src="/brand/rpa-automatic-horizontal.png" alt="RPA Automatic" width={2172} height={724}/>
    <small>© {new Date().getFullYear()} RPA Automatic. Todos os direitos reservados.</small>
  </footer>;
}
