import { describe, it, expect } from 'vitest';
import { escapeHtml } from '@/lib/utils';

describe('escapeHtml', () => {
    it('should escape basic HTML characters', () => {
        const input = '<script>alert("xss")</script>';
        const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
        expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape quotes and ampersands', () => {
        const input = '"\'&';
        const expected = '&quot;&#039;&amp;';
        expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle empty string', () => {
        expect(escapeHtml('')).toBe('');
    });

    it('should escape mixed content', () => {
        const input = 'Hello <b>World</b>';
        const expected = 'Hello &lt;b&gt;World&lt;/b&gt;';
        expect(escapeHtml(input)).toBe(expected);
    });
});
