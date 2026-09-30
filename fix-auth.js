const fs = require('fs');
let text = fs.readFileSync('c:/Users/admin.rafael/Desktop/crmevo/components/ui/auth-ui.tsx', 'utf8');

const newContainer = `import { login, signup } from '@/app/login/actions';

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
}`;

text = text.replace(/function AuthFormContainer[\s\S]*?return \([\s\S]*?\)\n\}/, newContainer);
text = text.replace(/function SignInForm\(\{ onSubmit \}: \{ onSubmit: \(e: React.FormEvent\) => void \}\) \{/, 'function SignInForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, loading?: boolean }) {');
text = text.replace(/function SignUpForm\(\{ onSubmit \}: \{ onSubmit: \(e: React.FormEvent\) => void \}\) \{/, 'function SignUpForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, loading?: boolean }) {');

// Add loading state to buttons
text = text.replace(/<Button type="submit" variant="default" className="mt-2">Entrar no CRM<\/Button>/, '<Button type="submit" variant="default" className="mt-2" disabled={loading}>{loading ? "Entrando..." : "Entrar no CRM"}</Button>');
text = text.replace(/<Button type="submit" variant="default" className="mt-2">Registrar<\/Button>/, '<Button type="submit" variant="default" className="mt-2" disabled={loading}>{loading ? "Registrando..." : "Registrar"}</Button>');

fs.writeFileSync('c:/Users/admin.rafael/Desktop/crmevo/components/ui/auth-ui.tsx', text, 'utf8');
console.log('Fixed auth UI');
