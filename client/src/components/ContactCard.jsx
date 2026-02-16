import { useState } from 'react';

export default function ContactCard({ contact, onEnrichEmail, onEnrichPhone }) {
  const [isEnrichingEmail, setIsEnrichingEmail] = useState(false);
  const [isEnrichingPhone, setIsEnrichingPhone] = useState(false);

  const handleEnrichEmail = async () => {
    setIsEnrichingEmail(true);
    try {
      await onEnrichEmail(contact.id);
    } finally {
      setIsEnrichingEmail(false);
    }
  };

  const handleEnrichPhone = async () => {
    setIsEnrichingPhone(true);
    try {
      await onEnrichPhone(contact.id);
    } finally {
      setIsEnrichingPhone(false);
    }
  };

  const getEmailButtonState = () => {
    if (contact.emailStatus === 'enriching' || isEnrichingEmail) {
      return {
        label: 'Retrieving...',
        disabled: true,
        className: 'bg-slate-200 text-slate-500 cursor-not-allowed',
        icon: 'loading',
      };
    }
    if (contact.emailStatus === 'retrieved') {
      return {
        label: 'Email Retrieved ✓',
        disabled: true,
        className: 'bg-emerald-100 text-emerald-700 cursor-not-allowed',
        icon: 'check',
      };
    }
    if (contact.emailStatus === 'not_available') {
      return {
        label: 'No Email Found',
        disabled: true,
        className: 'bg-red-100 text-red-700 cursor-not-allowed',
        icon: 'x',
      };
    }
    return {
      label: 'Get Email',
      disabled: false,
      className: 'bg-accent text-white hover:bg-accent-dark',
      icon: 'mail',
    };
  };

  const getPhoneButtonState = () => {
    if (contact.phoneStatus === 'enriching' || isEnrichingPhone) {
      return {
        label: 'Retrieving...',
        disabled: true,
        className: 'bg-slate-200 text-slate-500 cursor-not-allowed',
        icon: 'loading',
      };
    }
    if (contact.phoneStatus === 'retrieved') {
      return {
        label: 'Phone Retrieved ✓',
        disabled: true,
        className: 'bg-emerald-100 text-emerald-700 cursor-not-allowed',
        icon: 'check',
      };
    }
    if (contact.phoneStatus === 'not_available') {
      return {
        label: 'No Phone Found',
        disabled: true,
        className: 'bg-red-100 text-red-700 cursor-not-allowed',
        icon: 'x',
      };
    }
    return {
      label: 'Get Phone',
      disabled: false,
      className: 'bg-accent text-white hover:bg-accent-dark',
      icon: 'phone',
    };
  };

  const emailButton = getEmailButtonState();
  const phoneButton = getPhoneButtonState();

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
      {/* Contact Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <span className="text-slate-600 font-semibold text-lg">
            {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-lg">{contact.name}</h3>
          <p className="text-sm text-slate-600">{contact.title}</p>
          {contact.personaType && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent">
              {contact.personaType}
            </span>
          )}
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-2 mb-4 text-sm">
        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            LinkedIn Profile
          </a>
        )}
        {contact.seniority && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Seniority: {contact.seniority}
          </div>
        )}
        {contact.departments && contact.departments.length > 0 && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Department: {contact.departments.join(', ')}
          </div>
        )}
      </div>

      {/* Email Display */}
      <div className="mb-3 p-3 bg-slate-50 rounded-lg">
        <div className="text-xs font-medium text-slate-600 mb-1">Email</div>
        <div className="text-sm">
          {contact.emailStatus === 'retrieved' && contact.emailValue ? (
            <a href={`mailto:${contact.emailValue}`} className="text-accent hover:underline font-medium">
              {contact.emailValue} ✓
            </a>
          ) : contact.emailStatus === 'enriching' ? (
            <span className="text-slate-500">Retrieving... ⏳</span>
          ) : contact.emailStatus === 'not_available' ? (
            <span className="text-red-600">Not available ✗</span>
          ) : (
            <span className="text-slate-400">Not retrieved</span>
          )}
        </div>
      </div>

      {/* Phone Display */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="text-xs font-medium text-slate-600 mb-1">Phone</div>
        <div className="text-sm">
          {contact.phoneStatus === 'retrieved' && contact.phoneValue ? (
            <a href={`tel:${contact.phoneValue}`} className="text-accent hover:underline font-medium">
              {contact.phoneValue} ✓
            </a>
          ) : contact.phoneStatus === 'enriching' ? (
            <span className="text-slate-500">Retrieving... ⏳</span>
          ) : contact.phoneStatus === 'not_available' ? (
            <span className="text-red-600">Not available ✗</span>
          ) : (
            <span className="text-slate-400">Not retrieved</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleEnrichEmail}
          disabled={emailButton.disabled}
          className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${emailButton.className}`}
        >
          {emailButton.icon === 'loading' && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {emailButton.icon === 'check' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {emailButton.icon === 'x' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {emailButton.icon === 'mail' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          )}
          <span>{emailButton.label}</span>
          {emailButton.icon === 'mail' && (
            <span className="ml-auto text-xs opacity-75">1 credit</span>
          )}
        </button>

        <button
          onClick={handleEnrichPhone}
          disabled={phoneButton.disabled}
          className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${phoneButton.className}`}
        >
          {phoneButton.icon === 'loading' && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {phoneButton.icon === 'check' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {phoneButton.icon === 'x' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {phoneButton.icon === 'phone' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          )}
          <span>{phoneButton.label}</span>
          {phoneButton.icon === 'phone' && (
            <span className="ml-auto text-xs opacity-75">8 credits</span>
          )}
        </button>
      </div>
    </div>
  );
}
