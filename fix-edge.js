const fs = require('fs');

const files = [
    "c:/Users/admin.rafael/Desktop/crmevo/app/api/supabase/config/route.ts",
    "c:/Users/admin.rafael/Desktop/crmevo/app/api/supabase-status/route.ts",
    "c:/Users/admin.rafael/Desktop/crmevo/app/(dashboard)/clientes/[id]/page.tsx",
    "c:/Users/admin.rafael/Desktop/crmevo/app/(dashboard)/leads/[id]/page.tsx"
];

for (const f of files) {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        if (!content.includes("export const runtime = 'edge'")) {
            content = "export const runtime = 'edge';\n" + content;
            fs.writeFileSync(f, content, 'utf8');
            console.log(`Updated ${f}`);
        }
    } else {
        console.log(`File not found: ${f}`);
    }
}
