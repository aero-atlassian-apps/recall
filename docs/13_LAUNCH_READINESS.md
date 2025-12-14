# 13. Launch & Go-To-Market Readiness

## 13.1 Pre-Launch Checklist

### **Functional**
- [ ] Voice conversation completes successfully (5/5 times).
- [ ] Chapter generated correctly from session.
- [ ] Photo upload triggers correct analysis.
- [ ] Alert emails are sent (tested with mock data).

### **Security**
- [ ] All API keys rotated and secured.
- [ ] Database accessible only from Vercel IPs.
- [ ] RLS policies active and verified.

### **Legal/Compliance**
- [ ] Privacy Policy & ToS linked in footer.
- [ ] "Recording in Progress" indicator visible.
- [ ] Cookie Banner active.

---

## 13.2 Rollout Strategy

1.  **Alpha (Friends & Family):** 10 Users. Manual onboarding. White-glove support.
2.  **Beta (Waitlist):** 100 Users. Invite codes. Monitor costs closely.
3.  **Public Launch:** Marketing push. Feature flags ready to disable "Image Analysis" if costs spike.

---

## 13.3 Feedback Loops

-   **In-App:** "Report a Bug" button.
-   **Post-Session:** "How was that chat?" (1-5 stars) after session ends.
-   **Analytics:** Track "Session Completion Rate" as primary proxy for satisfaction.
