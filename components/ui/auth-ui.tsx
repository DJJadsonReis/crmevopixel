'use client';

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];

  useEffect(() => {
    let timeout: any;
    const currentString = textArray[textArrayIndex] || "";

    if (isDeleting) {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev.slice(0, -1));
        }, deleteSpeed);
      } else {
        setIsDeleting(false);
        if (textArrayIndex < textArray.length - 1) {
          setTextArrayIndex((prev) => prev + 1);
        } else if (loop) {
          setTextArrayIndex(0);
        }
      }
    } else {
      if (displayText.length < currentString.length) {
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev + currentString[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        }, speed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, delay);
      }
    }

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    displayText,
    isDeleting,
    speed,
    deleteSpeed,
    delay,
    loop,
    textArray,
    textArrayIndex,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

function PasswordInput({
  name,
  label,
  placeholder = "••••••••",
  autoComplete = "current-password",
  required = true,
}: {
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();

  return (
    <div className="grid gap-2 text-left">
      <label htmlFor={id} className="text-xs font-medium text-[var(--evo-muted)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="flex h-10 w-full rounded-xl border border-[var(--evo-border)] bg-[var(--evo-surface)] px-3 py-2 pr-10 text-sm text-[var(--evo-text)] placeholder:text-[var(--evo-muted)] focus:outline-none focus:border-evo-accent transition-colors"
        />
        <button
          type="button"
          className="absolute right-0 top-0 h-full px-3 py-2 text-[var(--evo-muted)] hover:text-[var(--evo-text)]"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? "Esconder senha" : "Ver senha"}
          </span>
        </button>
      </div>
    </div>
  );
}

function SignInForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; loading?: boolean }) {
  return (
    <form onSubmit={onSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 bg-evo-accent text-black rounded-2xl flex items-center justify-center font-bold text-xl mb-1 font-heading tracking-tighter shadow-lg">
          EVO
        </div>
        <h1 className="text-2xl font-bold text-[var(--evo-text)] font-heading">
          Acesso ao EVO PIXEL
        </h1>
        <p className="text-balance text-xs text-[var(--evo-muted)]">
          Insira suas credenciais corporativas
        </p>
      </div>
      <div className="grid gap-4 text-left">
        <div className="grid gap-2">
          <label htmlFor="email" className="text-xs font-medium text-[var(--evo-muted)]">
            Email Corporativo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="seu-email@empresa.com"
            required
            autoComplete="email"
            className="flex h-10 w-full rounded-xl border border-[var(--evo-border)] bg-[var(--evo-surface)] px-3 py-2 text-sm text-[var(--evo-text)] placeholder:text-[var(--evo-muted)] focus:outline-none focus:border-evo-accent transition-colors"
          />
        </div>
        <PasswordInput name="password" label="Senha" required autoComplete="current-password" placeholder="••••••••" />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-10 rounded-xl bg-evo-accent text-black font-semibold text-sm hover:bg-evo-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Autenticando..." : "Entrar no CRM"}
        </button>
      </div>
    </form>
  );
}

function SignUpForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; loading?: boolean }) {
  return (
    <form onSubmit={onSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 bg-evo-accent text-black rounded-2xl flex items-center justify-center font-bold text-xl mb-1 font-heading tracking-tighter shadow-lg">
          EVO
        </div>
        <h1 className="text-2xl font-bold text-[var(--evo-text)] font-heading">
          Novo Acesso
        </h1>
        <p className="text-balance text-xs text-[var(--evo-muted)]">
          Crie sua conta administrativa
        </p>
      </div>
      <div className="grid gap-4 text-left">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-xs font-medium text-[var(--evo-muted)]">
            Nome Completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Seu Nome"
            required
            autoComplete="name"
            className="flex h-10 w-full rounded-xl border border-[var(--evo-border)] bg-[var(--evo-surface)] px-3 py-2 text-sm text-[var(--evo-text)] placeholder:text-[var(--evo-muted)] focus:outline-none focus:border-evo-accent transition-colors"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="email" className="text-xs font-medium text-[var(--evo-muted)]">
            Email Corporativo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="seu-email@empresa.com"
            required
            autoComplete="email"
            className="flex h-10 w-full rounded-xl border border-[var(--evo-border)] bg-[var(--evo-surface)] px-3 py-2 text-sm text-[var(--evo-text)] placeholder:text-[var(--evo-muted)] focus:outline-none focus:border-evo-accent transition-colors"
          />
        </div>
        <PasswordInput name="password" label="Definir Senha" required autoComplete="new-password" placeholder="••••••••" />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-10 rounded-xl bg-evo-accent text-black font-semibold text-sm hover:bg-evo-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Criando Conta..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}

function AuthFormContainer({ isSignIn, onToggle }: { isSignIn: boolean; onToggle: () => void; }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      const supabase = createClient();
      
      if (isSignIn) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message === 'Invalid login credentials' ? 'Email ou senha inválidos.' : error.message);
        } else {
          window.location.href = '/';
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          setError(error.message);
        } else if (data.session) {
          window.location.href = '/';
        } else {
          setSuccess('Conta criada! Verifique seu email para confirmar o acesso ou faça login.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-[380px] gap-2 p-8 bg-[var(--evo-surface)] border border-[var(--evo-border)] rounded-2xl shadow-2xl">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs text-center mb-2">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs text-center mb-2">
          {success}
        </div>
      )}
      {isSignIn ? (
        <SignInForm onSubmit={handleSubmit} loading={loading} />
      ) : (
        <SignUpForm onSubmit={handleSubmit} loading={loading} />
      )}
      <div className="text-center text-xs mt-4 text-[var(--evo-muted)]">
        {isSignIn ? "Ainda não possui conta?" : "Já possui cadastro?"}{" "}
        <button
          type="button"
          className="pl-1 text-xs text-evo-accent hover:underline font-medium"
          onClick={onToggle}
        >
          {isSignIn ? "Criar conta" : "Fazer login"}
        </button>
      </div>
    </div>
  );
}

export function AuthUI() {
  const [isSignIn, setIsSignIn] = useState(true);
  const toggleForm = () => setIsSignIn((prev) => !prev);

  const quote = isSignIn
    ? {
        text: "Performance Estratégica, Design Impecável. O controle do seu império começa aqui.",
        author: "Rafael Costa - EVO PIXEL",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop"
      }
    : {
        text: "O primeiro passo para estruturar seu processo de prospecção e vendas B2B.",
        author: "Rafael Costa - EVO PIXEL",
        image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop"
      };

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-[var(--evo-bg)]">
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12 bg-gradient-to-br from-[var(--evo-bg)] to-[var(--evo-surface)]">
        <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} />
      </div>

      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-1000 ease-in-out border-l border-[var(--evo-border)]"
        style={{ backgroundImage: `url(${quote.image})` }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <div className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-t from-[var(--evo-bg)] to-transparent" />
        
        <div className="relative z-10 flex h-full flex-col items-center justify-end p-12 pb-16">
          <blockquote className="space-y-4 text-center text-white max-w-lg">
            <p className="text-2xl font-medium font-heading leading-tight">
              “<Typewriter
                key={quote.text}
                text={quote.text}
                speed={50}
              />”
            </p>
            <cite className="block text-sm font-light text-gray-300 not-italic uppercase tracking-widest">
              — {quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
