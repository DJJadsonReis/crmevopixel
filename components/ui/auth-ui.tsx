'use client';

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@/utils/supabase/client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    let timeout: NodeJS.Timeout;

    const currentString = textArray[textArrayIndex];

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

const labelVariants = cva(
  "text-xs font-medium text-[var(--evo-muted)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const inputVariants = cva(
  "flex h-10 w-full rounded-xl border border-[var(--evo-border)] bg-[var(--evo-surface)] px-3 py-2 text-sm text-[var(--evo-text)] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--evo-muted)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-evo-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants(), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-evo-accent text-black font-semibold hover:bg-evo-accent/90 shadow-md",
        link: "text-evo-accent underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

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
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
      </div>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="pr-10"
        />
        <Button
          type="button"
          variant="link"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-[var(--evo-muted)] hover:text-[var(--evo-text)]"
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
        </Button>
      </div>
    </div>
  );
}

function SignInForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; loading?: boolean }) {
  return (
    <form onSubmit={onSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 bg-evo-accent text-black rounded-2xl flex items-center justify-center font-bold text-xl mb-1 font-heading tracking-tighter shadow-lg">EVO</div>
        <h1 className="text-2xl font-bold text-[var(--evo-text)] font-heading">Acesso ao EVO PIXEL</h1>
        <p className="text-balance text-xs text-[var(--evo-muted)]">Insira suas credenciais corporativas</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email Corporativo</Label>
          <Input id="email" name="email" type="email" placeholder="seu-email@empresa.com" required autoComplete="email" />
        </div>
        <PasswordInput name="password" label="Senha" required autoComplete="current-password" placeholder="••••••••" />
        <Button type="submit" variant="default" className="mt-2 w-full" disabled={loading}>
          {loading ? "Autenticando..." : "Entrar no CRM"}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; loading?: boolean }) {
  return (
    <form onSubmit={onSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 bg-evo-accent text-black rounded-2xl flex items-center justify-center font-bold text-xl mb-1 font-heading tracking-tighter shadow-lg">EVO</div>
        <h1 className="text-2xl font-bold text-[var(--evo-text)] font-heading">Novo Acesso</h1>
        <p className="text-balance text-xs text-[var(--evo-muted)]">Crie sua conta administrativa</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" name="name" type="text" placeholder="Seu Nome" required autoComplete="name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email Corporativo</Label>
          <Input id="email" name="email" type="email" placeholder="seu-email@empresa.com" required autoComplete="email" />
        </div>
        <PasswordInput name="password" label="Definir Senha" required autoComplete="new-password" placeholder="••••••••" />
        <Button type="submit" variant="default" className="mt-2 w-full" disabled={loading}>
          {loading ? "Criando Conta..." : "Registrar"}
        </Button>
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
        <Button variant="link" type="button" className="pl-1 text-xs" onClick={onToggle}>
          {isSignIn ? "Criar conta" : "Fazer login"}
        </Button>
      </div>
    </div>
  );
}

interface AuthContentProps {
  image?: {
    src: string;
    alt: string;
  };
  quote?: {
    text: string;
    author: string;
  };
}

interface AuthUIProps {
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
}

const defaultSignInContent = {
  image: {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop",
    alt: "EVO PIXEL Design"
  },
  quote: {
    text: "Performance Estratégica, Design Impecável. O controle do seu império começa aqui.",
    author: "Rafael Costa - EVO PIXEL"
  }
};

const defaultSignUpContent = {
  image: {
    src: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop",
    alt: "A vibrant, modern space for new beginnings"
  },
  quote: {
    text: "O primeiro passo para estruturar seu processo de prospecção e vendas B2B.",
    author: "Rafael Costa - EVO PIXEL"
  }
};

export function AuthUI({ signInContent = {}, signUpContent = {} }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const toggleForm = () => setIsSignIn((prev) => !prev);

  const finalSignInContent = {
    image: { ...defaultSignInContent.image, ...signInContent.image },
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
    image: { ...defaultSignUpContent.image, ...signUpContent.image },
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-[var(--evo-bg)]">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12 bg-gradient-to-br from-[var(--evo-bg)] to-[var(--evo-surface)]">
        <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} />
      </div>

      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-1000 ease-in-out border-l border-[var(--evo-border)]"
        style={{ backgroundImage: `url(${currentContent.image.src})` }}
        key={currentContent.image.src}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <div className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-t from-[var(--evo-bg)] to-transparent" />
        
        <div className="relative z-10 flex h-full flex-col items-center justify-end p-12 pb-16">
          <blockquote className="space-y-4 text-center text-white max-w-lg">
            <p className="text-2xl font-medium font-heading leading-tight">
              “<Typewriter
                key={currentContent.quote.text}
                text={currentContent.quote.text}
                speed={50}
              />”
            </p>
            <cite className="block text-sm font-light text-gray-300 not-italic uppercase tracking-widest">
              — {currentContent.quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
