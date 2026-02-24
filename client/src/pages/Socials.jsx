const socials = [
  {
    name: "Facebook",
    url: "https://facebook.com/profile.php?id=61580967975176",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.988H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
    color: "hover:text-blue-500",
  },
  {
    name: "Instagram",
    url: "https://instagram.com/survivorstockexchange/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163c-3.259 0-3.667.014-4.947.072-1.613.073-3.048.44-4.192 1.583C1.717 2.797 1.35 4.232 1.277 5.845 1.219 7.125 1.205 7.533 1.205 12s.014 4.875.072 6.155c.073 1.613.44 3.048 1.583 4.192 1.144 1.144 2.579 1.51 4.192 1.583 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.613-.073 3.048-.44 4.192-1.583 1.144-1.144 1.51-2.579 1.583-4.192.058-1.28.072-1.688.072-4.947s-.014-4.875-.072-6.155c-.073-1.613-.44-3.048-1.583-4.192C19.715 1.717 18.28 1.35 16.667 1.277 15.387 1.219 14.979 1.205 12 1.205H12zm0 5.838a4.957 4.957 0 100 9.914 4.957 4.957 0 000-9.914zm0 8.162a3.205 3.205 0 110-6.41 3.205 3.205 0 010 6.41zm5.338-9.87a1.158 1.158 0 100 2.316 1.158 1.158 0 000-2.316z" />
      </svg>
    ),
    color: "hover:text-pink-500",
  },
  // {
  //   name: "X (Twitter)",
  //   url: "https://x.com/YOUR_HANDLE",
  //   icon: (
  //     <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
  //       <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  //     </svg>
  //   ),
  //   color: "hover:text-sky-400",
  // },
  {
    name: "GitHub",
    url: "https://github.com/tom-bagley",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .268.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
    color: "hover:text-white",
  },
];

export default function Socials() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <section className="max-w-md w-full mt-10 rounded-2xl bg-black/30 ring-1 ring-white/10 p-8 text-center">
        <img
          src="/logo.jpg"
          alt="Survivor Stock Exchange"
          className="mx-auto mb-5 rounded-xl object-cover"
          style={{
            height: 96,
            width: 96,
            boxShadow: "0 0 18px rgba(232,148,58,0.4)",
            border: "1px solid rgba(196,152,90,0.25)",
          }}
        />
        <h3 className="font-heading text-2xl mb-2">Follow Survivor Stock Exchange</h3>
        <p className="text-white/60 text-sm mb-8">
          Stay up to date with <span className="text-accent font-semibold">
          Survivor Stock Exchange</span> on social media.
          Interested in the development behind the project? Visit GitHub.
        </p>

        <div className="flex flex-col gap-4">
          {socials.map(({ name, url, icon, color }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-4 px-5 py-4 rounded-xl bg-white/5 ring-1 ring-white/10 text-white/70 ${color} hover:bg-white/10 hover:ring-white/20 transition-all group`}
            >
              <span className="transition-colors">{icon}</span>
              <span className="font-body font-medium text-base">{name}</span>
              <svg
                className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
