import { useState, type FormEvent } from "react";
import { ArrowRight, GitBranch, ShieldCheck, Workflow } from "lucide-react";
import { supabase } from "../lib/supabase";
import { BrandTop, BrandFooter, AssistantIcon } from "./Brand";
import { ThemeSwitcher } from "./ThemeProvider";
import { Button } from "./ui/button";
export function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      const { data, error } =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.session)
        setMessage("Conta criada. Confirme seu e-mail antes de entrar.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-theme">
        <ThemeSwitcher />
      </div>
      <section className="auth-brand">
        <div className="brand">
          <BrandTop />
          <span>
            Orchestrator <b>AI</b>
          </span>
        </div>
        <div className="auth-story">
          <span className="eyebrow">SEU WORKSPACE DE AUTOMAÇÃO</span>
          <h1>
            Da ideia à entrega.
            <br />
            <em>Com você no controle.</em>
          </h1>
          <p>
            Organize seus agentes, conecte o contexto e acompanhe cada etapa do
            trabalho.
          </p>
          <div className="auth-features">
            <span>
              <AssistantIcon label="Assistência inteligente" />
              Agentes especializados
            </span>
            <span>
              <Workflow />
              Execuções rastreáveis
            </span>
            <span>
              <ShieldCheck />
              Revisão humana
            </span>
          </div>
        </div>
        <div className="journey" aria-label="Etapas do trabalho">
          <span>
            <span className="journey-number">01</span>Planejar
          </span>
          <ArrowRight size={16} />
          <span>
            <span className="journey-number">02</span>Criar
          </span>
          <ArrowRight size={16} />
          <span>
            <span className="journey-number">03</span>Revisar
          </span>
        </div>
        <small>
          <GitBranch size={15} /> RPA Automatic · portal-orchestrator-ai
        </small>
      </section>
      <section className="auth-form">
        <div className="eyebrow">PORTAL ORCHESTRATOR AI</div>
        <h2>
          {mode === "login" ? "Entre no seu workspace" : "Crie seu acesso"}
        </h2>
        <p>Suas tarefas, agentes e decisões em um só lugar.</p>
        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@empresa.com"
            />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              placeholder="Sua senha"
            />
          </label>
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          <Button className="primary" disabled={busy}>
            {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            <ArrowRight size={17} />
          </Button>
        </form>
        <button
          className="text-button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "Primeiro acesso? Criar conta"
            : "Já tenho uma conta"}
        </button>
        <p className="auth-note">
          <ShieldCheck size={15} /> Autenticação segura com Supabase
        </p>
      </section>
      <BrandFooter />
    </div>
  );
}
