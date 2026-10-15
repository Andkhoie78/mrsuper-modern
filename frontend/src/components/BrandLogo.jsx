// MRSUPER_DYNAMIC_BRAND_LOGO_V2: single logo source for both public header and footer.
import {useSite} from '../context/SiteContext';
import {asset} from '../api/client';

export default function BrandLogo({sizeClassName = 'h-9 w-9'}) {
  const {config} = useSite();
  const raw = config?.settings?.logo_path;
  const logoPath = typeof raw === 'string' ? raw.trim() : '';
  const src = logoPath ? asset(logoPath) : '';

  // Keep the brand area the same size before site-config arrives.
  // No static book icon: it would flash on every page reload.
  return (
    <span data-mrsuper-logo="dynamic-v2" className={`inline-flex shrink-0 items-center justify-center ${sizeClassName}`}>
      {src ? <img src={src} alt="Website logo" className="h-full w-full object-contain" /> : null}
    </span>
  );
}
