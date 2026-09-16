import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, ExternalLink } from 'lucide-react';
import { apiGet } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

interface EduListItem {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  sort_order: number;
}

interface EduArticle extends EduListItem {
  body: string;
  sources: Array<{ name: string; url: string }>;
}

export default function Education() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState<EduListItem[]>([]);
  const [article, setArticle] = useState<EduArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        if (slug) {
          const a = await apiGet<EduArticle>(`/api/education?slug=${encodeURIComponent(slug)}`);
          setArticle(a);
        } else {
          const items = await apiGet<EduListItem[]>('/api/education');
          setList(items);
          setArticle(null);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <LoadingSpinner />;

  if (slug && article) {
    let sources: Array<{ name: string; url: string }> = [];
    try {
      sources = typeof article.sources === 'string' ? JSON.parse(article.sources as unknown as string) : article.sources || [];
    } catch {
      sources = [];
    }

    return (
      <div className="space-y-6 max-w-2xl">
        <button type="button" className="btn-ghost -ml-2" onClick={() => navigate('/education')}>
          <ArrowLeft className="w-4 h-4" /> All topics
        </button>
        <div>
          <p className="text-xs uppercase tracking-wide text-forest font-medium">{article.category}</p>
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal mt-1">{article.title}</h1>
        </div>
        <Disclaimer />
        <article className="rounded-2xl border border-border bg-white p-6 shadow-soft prose-breast">
          {article.body.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm sm:text-base text-charcoal/80 leading-relaxed mb-4 last:mb-0">{para}</p>
          ))}
        </article>
        {sources.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg mb-3">Authoritative sources</h2>
            <ul className="space-y-2">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-forest hover:underline">
                    {s.name} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-charcoal/45 mt-3">Links open official public pages. Content here is general education, not personal medical advice.</p>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Education Center"
        subtitle="Plain-language topics about breast self-awareness, screening, and talking with clinicians. Sourced from U.S. public health authorities — not a substitute for professional care."
      />
      <Disclaimer />
      {error && <p className="text-sm text-rose-deep">{error}</p>}

      {list.length === 0 ? (
        <p className="text-sm text-charcoal/55">No articles available yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((item) => (
            <Link
              key={item.id}
              to={`/education/${item.slug}`}
              className="card-interactive p-5 block"
            >
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-forest" />
                <span className="text-[11px] uppercase tracking-wide text-forest/80 font-medium">{item.category}</span>
              </div>
              <h3 className="font-display text-lg text-charcoal mb-1.5">{item.title}</h3>
              <p className="text-sm text-charcoal/60 leading-relaxed line-clamp-3">{item.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
