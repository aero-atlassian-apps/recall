
import { createDefaultPromptRegistry, PromptDefinition } from '../lib/core/application/agent/prompts/PromptRegistry';

// ============================================================================
// Audit Rules
// ============================================================================

interface AuditResult {
    promptId: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
}

const RULES = [
    {
        name: 'No Vague Language',
        check: (p: PromptDefinition): AuditResult | null => {
            const vaguePatterns = [/maybe/i, /i think/i, /arguably/i, /kind of/i];
            for (const pattern of vaguePatterns) {
                if (pattern.test(p.template)) {
                    return {
                        promptId: p.id,
                        level: 'WARN',
                        message: `Contains vague language matching ${pattern}: "${p.template.match(pattern)?.[0]}"`
                    };
                }
            }
            return null;
        }
    },
    {
        name: 'JSON Output Specification',
        check: (p: PromptDefinition): AuditResult | null => {
            if (p.template.includes('OUTPUT JSON') && !p.template.includes('```json') && !p.template.includes('{')) {
                return {
                    promptId: p.id,
                    level: 'WARN',
                    message: 'Mentions "OUTPUT JSON" but might lack a clear JSON example block.'
                };
            }
            return null;
        }
    },
    {
        name: 'Description Length',
        check: (p: PromptDefinition): AuditResult | null => {
            if (p.description.length < 10) {
                return {
                    promptId: p.id,
                    level: 'INFO',
                    message: 'Description is very short.'
                };
            }
            return null;
        }
    }
];

// ============================================================================
// Main Execution
// ============================================================================

function runAudit() {
    console.log('🚀 Starting Prompt Audit...\n');

    const registry = createDefaultPromptRegistry();
    const prompts = registry.list();
    const results: AuditResult[] = [];

    console.log(`Scanning ${prompts.length} prompts...`);

    for (const prompt of prompts) {
        for (const rule of RULES) {
            const result = rule.check(prompt);
            if (result) {
                results.push(result);
            }
        }
    }

    // Report
    console.log(`\nAudit Report:`);
    if (results.length === 0) {
        console.log(`✅ All prompts passed checks.`);
    } else {
        const warnings = results.filter(r => r.level === 'WARN');
        const errors = results.filter(r => r.level === 'ERROR');
        const infos = results.filter(r => r.level === 'INFO');

        console.log(`Found ${errors.length} errors, ${warnings.length} warnings, ${infos.length} infos.\n`);

        for (const r of results) {
            const icon = r.level === 'ERROR' ? '❌' : r.level === 'WARN' ? '⚠️ ' : 'ℹ️ ';
            console.log(`${icon} [${r.promptId}] ${r.message}`);
        }
    }

    if (results.some(r => r.level === 'ERROR')) {
        process.exit(1);
    }
}

runAudit();
