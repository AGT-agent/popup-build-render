import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { CustomFieldDef, CustomFieldDraft } from '@schema';
import { App } from './App';
import './builder.css';

// Fields the host already knows about — in a real app these come from the
// developer's own backend/config and show under "Your fields" in the picker.
const customFields: CustomFieldDef[] = [
  { key: 'first_name', label: 'First name', type: 'text', description: 'The friendly opener.' },
  { key: 'phone', label: 'Phone number', type: 'text', required: true },
  {
    key: 'plan',
    label: 'Interested in',
    type: 'radio',
    options: [
      { label: 'Starter', value: 'starter' },
      { label: 'Pro', value: 'pro' },
    ],
  },
];

// Simulates the host persisting a new field on its backend and returning the
// finalized def (with a validated key). The 900ms delay shows the picker loader.
function onCreateField(draft: CustomFieldDraft): Promise<CustomFieldDef> {
  const key = draft.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'field';
  return new Promise((resolve) => setTimeout(() => resolve({ ...draft, key }), 900));
}

// This file plays the role of the host developer integrating the builder: it
// just mounts <App /> (the exported `PopupBuilder`) and configures it via props.
// Change these values to restyle the builder chrome — exactly what a consumer
// would write in their own app.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      lang="he"
      theme="light"
      accent="#7c3aed"
      accentGradient="linear-gradient(135deg, #7c3aed, #ec4899)"
      onPublish={(popup) => console.log('publish', popup)}
      customFields={customFields}
      onCreateField={onCreateField}
    />
  </StrictMode>,
);
