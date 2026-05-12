const Footer = () => {
  return (
    <footer className='w-full py-8 border-t border-slate-800/50 bg-[#09121a]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5'>
      <div className='flex items-center gap-6'>
        {/* Icône GitHub */}
        <a
          href='https://github.com/ruddyautem'
          target='_blank'
          rel='noopener noreferrer'
          className='text-slate-500 hover:text-emerald-400 transition-colors'
          aria-label='GitHub'
        >
          <svg
            viewBox='0 0 24 24'
            width='18'
            height='18'
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'></path>
          </svg>
        </a>

        {/* Icône Globe / Web */}
        <a
          href='https://autem.dev'
          target='_blank'
          rel='noopener noreferrer'
          className='text-slate-500 hover:text-emerald-400 transition-colors'
          aria-label='Website'
        >
          <svg
            viewBox='0 0 24 24'
            width='18'
            height='18'
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='10'></circle>
            <line x1='2' y1='12' x2='22' y2='12'></line>
            <path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'></path>
          </svg>
        </a>
      </div>

      <p className='text-slate-400 text-[11px] uppercase tracking-[0.25em] font-medium text-center px-4'>
        &copy; {new Date().getFullYear()} AUTEM.DEV. TOUS DROITS RÉSERVÉS.
      </p>
    </footer>
  );
};

export default Footer;
