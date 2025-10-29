# 📦 Archive Documentation

**Purpose:** Historical documentation preserved for reference.

## 📁 Folder Structure

### **[audit/](./audit/)**
Security audit reports and remediation documentation from October 24, 2025:
- `CONTRACT_AUDIT_REPORT.md` - Comprehensive security audit findings
- `AUDIT_SUMMARY.md` - Executive summary of audit results
- `AUDIT_FIX_CHECKLIST.md` - Remediation tracking

**Status:** All critical and high-severity issues resolved ✅

---

### **[deployment-history/](./deployment-history/)**
Historical deployment process documentation from October 23-24, 2025:
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `DEPLOYMENT_QUICK_REFERENCE.md` - Quick deployment commands
- `DEPLOYMENT_TROUBLESHOOTING.md` - Common issues and solutions
- `PHASE1_COMPLETION_SUMMARY.md` - Migration completion report
- `IMPLEMENTATION_NOTES.md` - Development notes during migration
- `LMSR_RESOLUTION_IMPLEMENTATION.md` - Market resolution implementation
- `ORACLE_IMPLEMENTATION.md` - Oracle contract implementation
- `TREASURY_IMPLEMENTATION.md` - Treasury contract implementation

**Note:** Current deployment info is in [../DEPLOYMENT_RECORD.md](../DEPLOYMENT_RECORD.md)

---

### **[legacy/](./legacy/)**
Pre-migration documentation from October 21, 2025 (before MarketFactory v2):
- `Myriad-API.md` - Old Myriad Sports API integration (replaced)
- `Polkamarkets-SDK.md` - Old Polkamarkets SDK usage (replaced)
- `MOBILE-NAVIGATION.md` - Mobile navigation implementation
- `MOBILE-STRATEGY.md` - Mobile UI strategy
- `ACTIVITY-FEATURE.md` - Activity feed feature spec
- `COOKIE-ANALYTICS-SETUP.md` - Cookie consent and analytics
- `VERCEL-CRON-SETUP.md` - Vercel cron job configuration

**Status:** These docs reference deprecated systems and old architecture

---

### **Root Archive Files**

#### **contracts.md**
Legacy contract overview created during initial development. Superseded by [../ARCHITECTURE.md](../ARCHITECTURE.md).

#### **PROJECT_SPEC.md**
Original project specification and requirements. Historical reference for initial vision and scope.

---

## 🔍 When to Reference Archive Documentation

### **Use Audit Docs When:**
- Reviewing security considerations for new features
- Understanding why certain patterns were chosen
- Onboarding security-focused team members
- Preparing for future audits

### **Use Deployment History When:**
- Troubleshooting deployment issues
- Understanding past migration decisions
- Setting up similar infrastructure
- Learning from past problems

### **Use Legacy Docs When:**
- Understanding why certain features were removed
- Migrating remaining legacy code
- Researching alternative implementations
- Historical context on architecture decisions

---

## ⚠️ Important Notes

1. **Do NOT use as current reference** - These docs describe old systems
2. **Current info is in main Docs/ folder** - See [../README.md](../README.md)
3. **Preserved for historical context** - Don't delete, may be useful later
4. **Code examples may be outdated** - Always check current implementation

---

**Last Updated:** October 25, 2025
