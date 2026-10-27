export function socialDesktopShortcuts(profile) {
  return [
    { id: '@github', name: 'GitHub', icon: '/ubuntu-apps/github.svg', external: profile.github, protected: true },
    { id: '@linkedin', name: 'LinkedIn', icon: '/ubuntu-apps/linkedin.svg', external: profile.linkedin, protected: true },
    { id: '@gmail', name: 'Gmail', icon: '/ubuntu-apps/gmail.svg', external: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(profile.email)}`, protected: true },
  ].filter((shortcut) => Boolean(shortcut.external));
}
