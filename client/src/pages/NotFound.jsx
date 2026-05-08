import { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, TextInput } from 'flowbite-react';
import { HiOutlineHome, HiOutlineArrowLeft, HiMagnifyingGlass } from 'react-icons/hi2';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  const suggestions = useMemo(
    () => [
      { label: 'Browse Tutorials', to: '/tutorials' },
      { label: 'Try a Quiz', to: '/quizzes' },
      { label: 'Solve Problems', to: '/problems' },
      { label: 'Developer Tools', to: '/tools' },
    ],
    []
  );

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?searchTerm=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex items-center">
      {/* Background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-tr from-sky-400/30 to-indigo-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-br from-fuchsia-400/20 to-purple-600/20 blur-3xl" />
      </div>

      <div className="container px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/70 bg-white/70 p-8 text-center shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white shadow-lg">
            <span className="text-2xl font-black">404</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Page not found
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            We couldn’t find “{location.pathname}”. Try searching the library or jump to a popular area below.
          </p>

          {/* Quick search */}
          <form onSubmit={handleSearch} className="mx-auto mt-6 flex max-w-lg overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-sky-200 dark:border-slate-700 dark:bg-slate-900">
            <TextInput
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={HiMagnifyingGlass}
              placeholder="Search tutorials, posts, and problems..."
              className="flex-1 [&>div>input]:!border-0 [&>div>input]:!ring-0 [&>div>input]:!shadow-none"
            />
            <Button type="submit" className="!rounded-none rounded-r-full bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500">
              Search
            </Button>
          </form>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button color="light" onClick={goBack} pill>
              <HiOutlineArrowLeft className="mr-2" /> Go back
            </Button>
            <Button as={Link} to="/" gradientDuoTone="purpleToBlue" pill>
              <HiOutlineHome className="mr-2" /> Go home
            </Button>
          </div>

          {/* Suggestions */}
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Popular destinations</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <Link key={s.to} to={s.to} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-400">
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
