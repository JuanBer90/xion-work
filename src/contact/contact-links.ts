export const CONTACT_LINKS = {
  email: 'mailto:contact@xion.work',
  linkedin: 'https://www.linkedin.com/in/juanduarte90/',
  github: 'https://github.com/JuanBer90',
} as const;

export function applyContactLinks(root: HTMLElement): void {
  const email = root.querySelector<HTMLAnchorElement>('[data-contact-link="email"]');
  const linkedin = root.querySelector<HTMLAnchorElement>('[data-contact-link="linkedin"]');
  const github = root.querySelector<HTMLAnchorElement>('[data-contact-link="github"]');

  if (email) email.href = CONTACT_LINKS.email;
  if (linkedin) {
    linkedin.href = CONTACT_LINKS.linkedin;
    linkedin.target = '_blank';
    linkedin.rel = 'noopener noreferrer';
  }
  if (github) {
    github.href = CONTACT_LINKS.github;
    github.target = '_blank';
    github.rel = 'noopener noreferrer';
  }
}
