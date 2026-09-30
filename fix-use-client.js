const fs = require('fs');

const files = [
    'c:/Users/admin.rafael/Desktop/crmevo/app/(dashboard)/clientes/[id]/page.tsx',
    'c:/Users/admin.rafael/Desktop/crmevo/app/(dashboard)/leads/[id]/page.tsx'
];

for(const f of files) {
    if(fs.existsSync(f)) {
        let text = fs.readFileSync(f, 'utf8');
        text = text.replace(/export const runtime = 'edge';\r?\n?/g, '');
        if (text.includes("'use client'") || text.includes('"use client"')) {
            text = text.replace(/('use client'|"use client");?\r?\n?/, "'use client';\nexport const runtime = 'edge';\n");
        } else {
            text = "export const runtime = 'edge';\n" + text;
        }
        fs.writeFileSync(f, text, 'utf8');
        console.log('Fixed ' + f);
    }
}
