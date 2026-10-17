// MRSUPER_ABOUT_EDITABLE_V1: optional bilingual academy, founder and achievements information.
import {Award, BookOpen, Compass, HeartHandshake, UserRound} from 'lucide-react';
import {asset} from '../api/client';
import Seo from '../components/Seo';
import {useSite} from '../context/SiteContext';

const asText = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
const lines = value => asText(value).split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 30);

export default function AboutPage() {
  const {config, locale} = useSite();
  const settings = config.settings || {};
  const fa = locale === 'fa';
  const siteName = asText(settings.site_name) || 'MrSuper';
  const content = name => asText(settings[`about_${name}_${fa ? 'fa' : 'en'}`]) || asText(settings[`about_${name}_en`]);
  const founder = content('owner_name');
  const role = content('owner_role');
  const biography = content('owner_bio');
  const founderPhoto = asText(settings.about_founder_photo_path);
  const academyPhoto = asText(settings.about_academy_photo_path);
  const intro = content('intro');
  const story = content('story');
  const mission = content('mission');
  const vision = content('vision');
  const achievements = lines(content('achievements'));
  const ownerAchievements = lines(content('owner_achievements'));
  const hasFounder = Boolean(founder || role || biography || founderPhoto || ownerAchievements.length);
  const hasStory = Boolean(intro || story || academyPhoto);
  const hasMission = Boolean(mission || vision);
  const hasData = hasFounder || hasStory || hasMission || achievements.length;
  return <div className="container-page py-10 md:py-14">
    <Seo title={fa ? `درباره ${siteName}` : `About ${siteName}`} description={intro || asText(settings.site_description) || undefined}/>
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 rounded-3xl border bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 md:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800"><BookOpen size={16}/>{fa ? 'درباره ما' : 'About us'}</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{fa ? `درباره ${siteName}` : `About ${siteName}`}</h1>
        {intro && <p className="mt-5 max-w-4xl whitespace-pre-line text-base leading-8 text-slate-700 md:text-lg">{intro}</p>}
      </div>

      {hasStory && (story || academyPhoto) && <section className="mb-8 grid items-center gap-6 md:grid-cols-2" aria-label={fa ? 'معرفی آکادمی' : 'Our academy'}>
        {story && <div className="card p-6 md:p-8"><h2 className="text-2xl font-extrabold">{fa ? 'داستان و معرفی ما' : 'Our story'}</h2><p className="mt-4 whitespace-pre-line leading-8 muted">{story}</p></div>}
        {academyPhoto && <div className="overflow-hidden rounded-3xl border bg-slate-50"><img src={asset(academyPhoto)} alt={fa ? 'تصویر آکادمی' : 'Our academy'} className="aspect-[4/3] w-full object-cover" loading="lazy"/></div>}
      </section>}

      {hasFounder && <section className="card mb-8 overflow-hidden p-6 md:p-9" aria-label={fa ? 'صاحب و بنیان‌گذار' : 'Founder'}>
        <div className="grid items-start gap-7 md:grid-cols-[240px_minmax(0,1fr)]">
          {founderPhoto && <img src={asset(founderPhoto)} alt={founder || (fa ? 'صاحب آکادمی' : 'Founder')} className="aspect-[4/5] w-full max-w-72 rounded-2xl bg-slate-100 object-cover" loading="lazy"/>}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-700"><UserRound size={17}/>{fa ? 'صاحب / بنیان‌گذار' : 'Owner / Founder'}</div>
            {founder && <h2 className="mt-3 text-2xl font-black md:text-3xl">{founder}</h2>}
            {role && <p className="mt-2 font-semibold text-slate-600">{role}</p>}
            {biography && <p className="mt-4 whitespace-pre-line leading-8 muted">{biography}</p>}
            {ownerAchievements.length > 0 && <div className="mt-6"><h3 className="mb-3 font-bold">{fa ? 'دستاوردهای صاحب آکادمی' : 'Founder achievements'}</h3><ul className="list-inside list-disc space-y-2 text-slate-600">{ownerAchievements.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
          </div>
        </div>
      </section>}

      {hasMission && <div className="mb-8 grid gap-5 md:grid-cols-2">
        {mission && <section className="card p-6"><h2 className="flex items-center gap-3 text-xl font-extrabold"><HeartHandshake className="text-blue-600"/>{fa ? 'ماموریت ما' : 'Our mission'}</h2><p className="mt-4 whitespace-pre-line leading-8 muted">{mission}</p></section>}
        {vision && <section className="card p-6"><h2 className="flex items-center gap-3 text-xl font-extrabold"><Compass className="text-blue-600"/>{fa ? 'دیدگاه ما' : 'Our vision'}</h2><p className="mt-4 whitespace-pre-line leading-8 muted">{vision}</p></section>}
      </div>}

      {achievements.length > 0 && <section className="mb-8" aria-label={fa ? 'دستاوردها' : 'Achievements'}>
        <h2 className="mb-5 flex items-center gap-3 text-2xl font-black"><Award className="text-amber-600"/>{fa ? 'دستاوردهای آکادمی' : 'Our achievements'}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{achievements.map((item, i) => <article key={i} className="card p-5"><div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-amber-50 text-amber-700"><Award size={18}/></div><p className="whitespace-pre-line leading-7">{item}</p></article>)}</div>
      </section>}
      {!hasData && <p className="py-10 text-center text-sm muted">{fa ? 'معلومات بیشتر درباره آکادمی به زودی اضافه می‌شود.' : 'More information about our academy will be added soon.'}</p>}
    </div>
  </div>;
}
