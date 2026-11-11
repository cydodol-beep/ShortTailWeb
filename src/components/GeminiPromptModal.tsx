import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Terminal, Code, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GeminiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiPromptModal: React.FC<GeminiPromptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const masterPromptText = `You are an expert full-stack developer. Build a mobile-responsive web application for customer self-service shopping integrated with an existing Supabase store POS database.

### PROJECT OVERVIEW
- **App Name**: ShortTail Web Store (Mobile-Responsive Customer Self-Service Ordering)
- **Primary Goal**: Allow store customers to validate their phone number, browse available store items/products, manage a shopping cart, and place orders directly saved into the shared POS Supabase database.

---

### SUPABASE DATABASE CONFIGURATION
- **Supabase URL**: \`https://gggpkciminardekbmpyk.supabase.co\`
- **Anon Public Key**: \`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ3BrY2ltaW5hcmRla2JtcHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzk0MzcsImV4cCI6MjA3OTgxNTQzN30.2mx1CKUBZDnhyNpeZ1JlwDk_OJ7MAwyW_VBVDIBQMKc\`

---

### DATABASE TABLES & SCHEMAS

1. **\`customers\` Table**:
   - Columns: \`id\` (uuid), \`name\` (text), \`phone\` (text, e.g. '62811223344'), \`address\` (text), \`province\` (text), \`city\` (text), \`postcode\` (text), \`created_at\` (timestamp)

2. **\`products\` Table**:
   - Columns: \`id\` (uuid), \`name\` (text), \`description\` (text), \`category\` (text), \`category_id\` (uuid), \`base_price\` (numeric), \`stock_quantity\` (integer), \`main_image_url\` (text), \`unit_weight_grams\` (integer), \`is_active\` (boolean)

3. **\`categories\` Table**:
   - Columns: \`id\` (uuid), \`name\` (text), \`slug\` (text), \`description\` (text), \`image_url\` (text)

4. **\`orders\` Table**:
   - Columns: \`id\` (uuid), \`custom_order_id\` (text), \`source\` (text) -> MUST BE SET TO 'WebStore', \`status\` (text, default 'pending'), \`subtotal\` (numeric), \`total_amount\` (numeric), \`recipient_name\` (text), \`recipient_phone\` (text), \`recipient_address\` (text), \`recipient_province\` (text), \`recipient_city\` (text), \`notes\` (text), \`created_at\` (timestamp)

5. **\`order_items\` Table**:
   - Columns: \`id\` (uuid), \`order_id\` (uuid), \`product_id\` (uuid), \`quantity\` (integer), \`price_at_purchase\` (numeric)

---

### APPLICATION WORKFLOW & STEPS

#### Step 1: Customer Phone Validation & Registration
- Initial landing step asks customer to search their phone number.
- Standard default phone format: Country code \`62\` followed by phone number without leading zero (\`0\`), e.g., \`628123456789\`.
- Query Supabase \`customers\` table by \`phone\`.
- **If match found**: Confirm existing customer identity (Name, Phone, Address) and proceed to product showcase.
- **If no match**: Present registration form for new customer:
  - Customer Name
  - Phone Number (formatted with 62 prefix)
  - Full Address
  - Province
  - City / Regency
  - Postcode
- Save newly registered customer into Supabase \`customers\` table, set active customer context, and proceed to product showcase.

#### Step 2: Product Showcase & Catalog
- Modern, clean, mobile-first responsive layout with Tailwind CSS.
- Top navigation bar showing current customer identity badge with "Ganti" button.
- Real-time search bar & horizontal category filter tabs.
- Product cards displaying product image, stock status badge, price in Indonesian Rupiah (Rp), unit weight, and quantity controls ("+ Keranjang" or \`-\` \`qty\` \`+\`).

#### Step 3: Shopping Cart Drawer
- Slide-over drawer / bottom sheet on mobile showing picked items, unit prices, subtotal, and quantity adjustment.
- Customer shipping address confirmation box.
- Optional customer order notes textarea.
- Sticky checkout bar with Total Amount.

#### Step 4: Checkout Process & WhatsApp Contact
- Clicking Checkout saves order into Supabase:
  - Inserts row into \`orders\` table with \`source = 'WebStore'\` and \`status = 'pending'\`.
  - Inserts items into \`order_items\` table linked by \`order_id\`.
- Displays Thank You modal containing generated Order Code (\`custom_order_id\`), itemized summary, and customer details.
- Features prominent green button **"Hubungi Admin via Whatsapp"** linking to \`https://wa.me/628115935977?text=...\`.
- Pre-filled WhatsApp message format:
  \`Halo kak, saya sudah pesen melalui web ya. tolong dibantu cek\` (accompanied by Order ID and Customer Name).`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(masterPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100"
        >
          {/* Header */}
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Master Prompt for Google Gemini</h3>
                <p className="text-[11px] text-slate-400">Gunakan prompt ini di Gemini untuk mereplikasi web app ini</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Code Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-emerald-400 leading-relaxed space-y-4">
            <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
              <span className="flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>gemini_prompt_specification.md</span>
              </span>
              <span>Markdown Specification</span>
            </div>

            <pre className="whitespace-pre-wrap font-mono text-slate-200 text-xs selection:bg-emerald-800">
              {masterPromptText}
            </pre>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Siap dicopy langsung ke Google Gemini
            </span>

            <button
              onClick={handleCopyPrompt}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Prompt Berhasil Dicopy!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Prompt Gemini</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
