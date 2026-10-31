export function gmailComposeUrl(email) {
  return `https://mail.google.com/mail/u/0/?fs=1&to=${encodeURIComponent(email)}&tf=cm`;
}

export function socialDesktopShortcuts(profile) {
  return [
    { id: '@github', name: 'GitHub', icon: '/ubuntu-apps/github.svg', external: profile.github, protected: true },
    { id: '@linkedin', name: 'LinkedIn', icon: '/ubuntu-apps/linkedin.svg', external: profile.linkedin, protected: true },
    { id: '@gmail', name: 'Gmail', icon: '/ubuntu-apps/gmail.svg', external: gmailComposeUrl(profile.email), protected: true },
  ].filter((shortcut) => Boolean(shortcut.external));
}
