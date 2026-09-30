'use client';

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--evo-text)]"
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

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--evo-accent)] text-black hover:opacity-90 font-bold",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-[var(--evo-border)] bg-[var(--evo-surface)] text-[var(--evo-text)] hover:bg-[var(--evo-surface2)]",
        secondary: "bg-[var(--evo-surface2)] text-[var(--evo-text)] hover:bg-opacity-80",
        ghost: "hover:bg-[var(--evo-surface)] text-[var(--evo-text)]",
        link: "text-[var(--evo-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[var(--evo-border)] bg-[var(--evo-surface)] px-3 py-3 text-sm text-[var(--evo-text)] shadow-sm shadow-black/5 transition-shadow placeholder:text-[var(--evo-muted)] focus-visible:border-[var(--evo-accent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-[var(--evo-muted)] transition-colors hover:text-[var(--evo-text)] focus-visible:text-[var(--evo-text)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

function SignInForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, loading?: boolean }) {
  return (
    <form onSubmit={onSubmit} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-16 h-16 bg-[var(--evo-accent)] text-black rounded-full flex items-center justify-center font-bold text-2xl mb-2 font-heading tracking-tighter">EVO</div>
        <h1 className="text-2xl font-bold text-[var(--evo-text)] font-heading">Acesso ao EVO PIXEL</h1>
        <p className="text-balance text-sm text-[var(--evo-muted)]">Insira suas credenciais corporativas</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="email">Email de Acesso</Label><Input id="email" name="email" type="email" placeholder="ceo@evopixel.com.br" required autoComplete="email" /></div>
        <PasswordInput name="password" label="Senha" required autoComplete="current-password" placeholder="••••••••" />
        <Button type="submit" variant="default" className="mt-2" disabled={loading}>{loading ? "Entrando..." : "Entrar no CRM"}</Button>
      </div>
    </form>
  );
}

function SignUpForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, loading?: boolean }) {
  return (
    <form onSubmit={onSubmit} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-16 h-16 bg-[var(--evo-accent)] text-black rounded-full flex items-center justify-center font-bold text-2xl mb-2 font-heading tracking-tighter">EVO</div>
        <h1 className="text-2xl font-bold text-[var(--evo-text)] font-heading">Novo Acesso</h1>
        <p className="text-balance text-sm text-[var(--evo-muted)]">Crie sua conta administrativa</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-1"><Label htmlFor="name">Nome Completo</Label><Input id="name" name="name" type="text" placeholder="Seu Nome" required autoComplete="name" /></div>
        <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="ceo@evopixel.com.br" required autoComplete="email" /></div>
        <PasswordInput name="password" label="Senha" required autoComplete="new-password" placeholder="••••••••"/>
        <Button type="submit" variant="default" className="mt-2" disabled={loading}>{loading ? "Registrando..." : "Registrar"}</Button>
      </div>
    </form>
  );
}

import { login, signup } from '@/app/login/actions';

function AuthFormContainer({ isSignIn, onToggle }: { isSignIn: boolean; onToggle: () => void; }) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            if (isSignIn) {
                const res = await login(formData);
                if (res?.error) setError(res.error);
            } else {
                const res = await signup(formData);
                if (res?.error) setError(res.error);
            }
        } catch(err) {
            setError('Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto grid w-[350px] gap-2 p-8 bg-[var(--evo-surface)] border border-[var(--evo-border)] rounded-2xl shadow-2xl">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm text-center mb-4">{error}</div>}
            {isSignIn ? <SignInForm onSubmit={handleSubmit} loading={loading} /> : <SignUpForm onSubmit={handleSubmit} loading={loading} />}
            <div className="text-center text-sm mt-4 text-[var(--evo-muted)]">
                {isSignIn ? "Ainda não tem acesso?" : "Já possui conta?"}
                <Button variant="link" type="button" className="pl-1" onClick={onToggle}>
                    {isSignIn ? "Criar conta" : "Fazer login"}
                </Button>
            </div>
        </div>
    )
}

interface AuthContentProps {
    image?: {
        src: string;
        alt: string;
    };
    quote?: {
        text: string;
        author: string;
    }
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
      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12 bg-gradient-to-br from-[var(--evo-bg)] to-[var(--evo-surface)]">
        <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} />
      </div>

      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-1000 ease-in-out border-l border-[var(--evo-border)]"
        style={{ backgroundImage: `url(${currentContent.image.src})` }}
        key={currentContent.image.src}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
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

